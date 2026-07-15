const LoginManager = {
    initLogin() {
        console.log("=== Memulakan LoginManager ===");
        
        // Pemetaan elemen UI daripada DOM index.html
        this.classSelect = document.getElementById('login-class-select');
        this.studentSelect = document.getElementById('login-student-select');
        this.passwordInput = document.getElementById('login-password-input');
        this.submitBtn = document.getElementById('login-submit-btn');
        this.errorMsg = document.getElementById('login-error-msg');
        this.spinner = document.getElementById('login-spinner');
        this.loginScreen = document.getElementById('login-screen');
        this.startScreen = document.getElementById('start-screen');
        this.welcomeText = document.getElementById('welcome-user-text');

        // Diagnostik Elemen HTML
        console.log("Semakan Elemen HTML:");
        console.log("- Dropdown Kelas:", this.classSelect ? "Wujud ✅" : "TIDAK WUJUD ❌ (Semak ID di index.html)");
        console.log("- Dropdown Murid:", this.studentSelect ? "Wujud ✅" : "TIDAK WUJUD ❌");
        console.log("- Butang Submit:", this.submitBtn ? "Wujud ✅" : "TIDAK WUJUD ❌");

        // Pendaftaran Event Listener
        if (this.classSelect) this.classSelect.addEventListener('change', () => this.loadStudents());
        if (this.submitBtn) this.submitBtn.addEventListener('click', () => this.submitLogin());

        // Mulakan pemuatan data kelas
        this.loadClasses();
    },

    async loadClasses() {
        this.showError(null);
        
        if (!this.classSelect) {
            console.error("Ralat: Elemen 'login-class-select' tidak dijumpai dalam HTML.");
            return;
        }
        
        this.classSelect.innerHTML = '<option value="">-- Memuatkan kelas... --</option>';
        
        // FUNGSI KECEMASAN (Jika API tiada / internet sekolah lambat)
        // FUNGSI KECEMASAN (Jika API tiada / internet sekolah lambat)
        const muatKelasManual = () => {
            console.warn("[Login Engine]: Menggunakan senarai kelas kecemasan (Fallback).");
            this.classSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';
            
            // DIKEMAS KINI: Senarai kelas sebenar berdasarkan Google Sheets anda
            const senaraiKelasKecemasan = [
                "1C","1S","1I", "1J","1P","1M",
                "2C","2S","2I","2J","2P","2M","2B",    
                "3C","3S","3I", "3J","3P","3M",
                "4C","4S","4I", "4J","4P","4M",
                "5C","5S","5I", "5J","5P","5M",
                "6C","6S","6I", "6J","6P","6M",
                "PRA HARMONI","PRA KREATIF", 
                "PPKI NILAM", "PPKI PERMATA", "PPKI DELIMA"
            ];
            
            senaraiKelasKecemasan.forEach(kelas => {
                const opt = document.createElement('option');
                opt.value = kelas;
                opt.textContent = kelas;
                this.classSelect.appendChild(opt);
            });
        };

        // Semak jika objek window.API belum sedia
        if (!window.API || typeof window.API.getClasses !== 'function') {
            console.error("Ralat: window.API.getClasses tidak wujud lagi. Membuka mod kecemasan...");
            muatKelasManual();
            return;
        }

        try {
            console.log("Sedang memanggil API.getClasses()...");
            const res = await window.API.getClasses();
            console.log("Respons diterima daripada API:", res);
            
            if (res && res.success && Array.isArray(res.classes)) {
                console.log("Data kelas berjaya diproses. Jumlah kelas:", res.classes.length);
                this.classSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';
                res.classes.forEach(kelas => {
                    const opt = document.createElement('option');
                    opt.value = kelas;
                    opt.textContent = kelas;
                    this.classSelect.appendChild(opt);
                });
            } else {
                throw new Error("Respons API tidak menepati format.");
            }
        } catch (error) {
            console.error("Gagal menarik data kelas dari cloud database:", error);
            muatKelasManual(); // Jalankan kelas manual jika ralat berlaku
        }
    },

    async loadStudents() {
        this.showError(null);
        if (!this.classSelect || !this.studentSelect) return;
        
        const kelasTerpilih = this.classSelect.value;
        console.log("Kelas dipilih:", kelasTerpilih);
        
        if (!kelasTerpilih) {
            this.studentSelect.innerHTML = '<option value="">-- Pilih Kelas Dahulu --</option>';
            this.studentSelect.disabled = true;
            return;
        }

        this.studentSelect.disabled = true;
        this.studentSelect.innerHTML = '<option value="">-- Memuatkan nama murid... --</option>';

        const res = await window.API.getStudents(kelasTerpilih);
        console.log(`Respons murid untuk kelas ${kelasTerpilih}:`, res);
        
        if (res && res.success && Array.isArray(res.students)) {
            this.studentSelect.innerHTML = '<option value="">-- Pilih Nama Anda --</option>';
            res.students.forEach(student => {
                const opt = document.createElement('option');
                opt.value = student.id;
                opt.textContent = student.nama.toUpperCase();
                this.studentSelect.appendChild(opt);
            });
            this.studentSelect.disabled = false;
        } else {
            this.studentSelect.innerHTML = '<option value="">-- Gagal memuatkan nama --</option>';
            this.showError("Gagal mengambil data murid bagi kelas tersebut.");
        }
    },

    async submitLogin() {
        this.showError(null);
        if (!this.classSelect || !this.studentSelect || !this.passwordInput) return;
        
        // PENTING: Aktifkan kebenaran audio pelayar web sebaik sahaja butang ditekan
        if (typeof window.SOUNDS !== 'undefined') {
            Object.values(window.SOUNDS).forEach(audio => {
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(() => {/* Abaikan ralat awal */});
            });
        }
        
        const kelas = this.classSelect.value;
        const studentId = this.studentSelect.value;
        const password = this.passwordInput.value.trim();

        if (!kelas || !studentId || !password) {
            this.showError("Sila pastikan semua ruangan dipilih/diisi.");
            return;
        }

        this.showLoading(true);
        const res = await window.API.login(studentId, password);
        this.showLoading(false);

        console.log("Pengesahan Log Masuk Diterima:", res);

        if (res && res.success && res.studentData) {
            // 1. STRUKTUR GLOBAL DATA: Sediakan takungan data utama
            window.GAME = window.GAME || {};
            window.GAME.student = {
                id: res.studentData.id,
                nama: res.studentData.nama,
                kelas: res.studentData.kelas
            };

            // 2. DIKEMAS KINI: Sediakan objek .session awal supaya exitToStart() & hantarDataKeGoogleSheets() tidak ralat
            window.GAME.session = {
                idMurid: res.studentData.id,
                namaMurid: res.studentData.nama,
                kelasMurid: res.studentData.kelas,
                jumlahMarkahKuiz: 0,
                score: 0,
                jumlahMarkah: 0, // Markah minigame
                levelTertinggi: 1
            };

            // Masukkan nama pemain ke skrin mula permainan secara visual
            if (this.welcomeText) {
                this.welcomeText.textContent = `Prajurit: ${res.studentData.nama} (${res.studentData.kelas})`;
            }
            
            // 3. DIKEMAS KINI: Panggil fungsi navigasi berpusat dari main.js untuk ke start-screen
            console.log("Log masuk sukses! Menghantar murid ke skrin menu utama.");
            if (typeof window.tukarKeMenuUtama === 'function') {
                window.tukarKeMenuUtama();
            } else if (typeof showScreen === 'function') {
                showScreen('start-screen');
            } else {
                // Fallback jika kaedah main.js belum dimuatkan sepenuhnya
                if (this.loginScreen) this.loginScreen.classList.add('hidden');
                if (this.startScreen) this.startScreen.classList.remove('hidden');
            }
            
            // Kosongkan input kata laluan untuk keselamatan sesi seterusnya
            this.passwordInput.value = '';
        } else {
            this.showError(res.message || "Kata laluan tidak sepadan.");
        }
    },

    showError(text) {
        if (!this.errorMsg) return;
        if (!text) { this.errorMsg.classList.add('hidden'); return; }
        this.errorMsg.textContent = text;
        this.errorMsg.classList.remove('hidden');
        this.errorMsg.classList.remove('shake');
        void this.errorMsg.offsetWidth; 
        this.errorMsg.add('shake');
    },

    showLoading(isLoading) {
        if (!this.submitBtn || !this.spinner) return;
        this.submitBtn.disabled = isLoading;
        if (isLoading) this.spinner.classList.remove('hidden');
        else this.spinner.classList.add('hidden');
    }
};

window.initLogin = () => LoginManager.initLogin();