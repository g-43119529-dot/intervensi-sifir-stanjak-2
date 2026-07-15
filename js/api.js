const KUIZ_API_URL = "https://script.google.com/macros/s/AKfycbxKgvFEyPNGSfFIu20D03odSXRxUrr-jC9-g2xJnieAYLbBqZUiz9WCU6PQO-PqAgR40w/exec";

window.API = {
    // Ambil senarai kelas
    async getClasses() {
        try {
            const response = await fetch(`${KUIZ_API_URL}?action=getClasses&_=${Date.now()}`);
            if (!response.ok) throw new Error("Respons rangkaian gagal.");
            
            const textData = await response.text(); 
            return JSON.parse(textData);
        } catch (error) {
            console.error("Ralat getClasses:", error);
            return { success: false, message: error.message };
        }
    },

    // Ambil nama murid berdasarkan kelas
    async getStudents(kelas) {
        try {
            const encodeKelas = encodeURIComponent(kelas);
            const response = await fetch(`${KUIZ_API_URL}?action=getStudents&kelas=${encodeKelas}&_=${Date.now()}`);
            if (!response.ok) throw new Error("Respons rangkaian gagal.");
            
            const textData = await response.text();
            return JSON.parse(textData);
        } catch (error) {
            console.error("Ralat getStudents:", error);
            return { success: false, message: error.message };
        }
    },

    // Pengesahan log masuk akaun
    async login(studentId, password) {
        try {
            const response = await fetch(`${KUIZ_API_URL}?action=login&studentId=${encodeURIComponent(studentId)}&password=${encodeURIComponent(password)}&_=${Date.now()}`);
            if (!response.ok) throw new Error("Pengesahan gagal.");
            
            const textData = await response.text();
            return JSON.parse(textData);
        } catch (error) {
            console.error("Ralat login:", error);
            return { success: false, message: "Gagal menghubungi pelayan log masuk." };
        }
    },

    // Mengambil soalan daripada Google Sheet berdasarkan parameter tahap
    async getQuestionsFromSheet(level) {
        try {
            const response = await fetch(`${KUIZ_API_URL}?action=getQuizQuestions&level=${level}&_=${Date.now()}`);
            if (!response.ok) throw new Error("Gagal mengambil data soalan daripada pelayan.");
            
            const textData = await response.text();
            return JSON.parse(textData);
        } catch (error) {
            console.error("Ralat mengambil soalan (getQuestionsFromSheet):", error);
            return { success: false, message: error.message };
        }
    }
};