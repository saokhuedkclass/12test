// --- CẤU HÌNH ---
    const googleScriptURL = 'https://script.google.com/macros/s/AKfycbyg5KT1vKt8j-TkjJEQEOxmfj2IOgLbESw8VMyfWoVygXtYsolpiJbf9-imXl8_AB_-_g/exec';

    // 1. ĐÁP ÁN PHẦN 1: TRẮC NGHIỆM (0.25đ/câu)
    const correctAnswersPart1 = {
        q1: "A", 
        q2: "B", 
        q3: "A",
		q4: "A",
		q5: "A",
		q6: "C"
    };

    // 2. ĐÁP ÁN PHẦN 2: ĐÚNG SAI (Thang 0.1 - 0.25 - 0.5 - 1.0)
    // true = Đúng, false = Sai
    const correctAnswersPart2 = {
        q7: {
            1: "true",
            2: "true",
            3: "false",
            4: "true"
        },
		q8: {
			1: "false",
			2: "true",
			3: "false",
			4: "true"
		},
		q9: {
			1: "true",
			2: "false",
			3: "true",
			4: "true"
		},
		q10: {
			1: "true",
			2: "false",
			3: "false",
			4: "true"
		}
    };

    // 3. ĐÁP ÁN PHẦN 3: TRẢ LỜI NGẮN (0.5đ/câu)
    // Lưu ý: Viết đáp án chuẩn, code sẽ tự động viết thường và xóa khoảng trắng thừa của HS
    const correctAnswersPart3 = {
        q11: "0,05",
        q12: "46",
		q13: "22",
		q14: "8,64"
    };

    // --- CẤU HÌNH THỜI GIAN ---
    const TIME_LIMIT = 30; 
    let timeInSeconds = TIME_LIMIT * 60;
    let timerInterval;

    window.onload = function() { startTimer(); };

    function startTimer() {
        const display = document.getElementById('countdown');
        const timerBox = document.getElementById('timer-box');
        timerInterval = setInterval(() => {
            let m = Math.floor(timeInSeconds / 60);
            let s = timeInSeconds % 60;
            display.textContent = (m<10?"0"+m:m) + ":" + (s<10?"0"+s:s);
            if (timeInSeconds < 60) timerBox.classList.add("warning");
            if (--timeInSeconds < 0) {
                clearInterval(timerInterval);
                handleTimeOut();
            }
        }, 1000);
    }

    function handleTimeOut() {
        alert("⏰ ĐÃ HẾT GIỜ! Hệ thống đang tự động nộp bài.");
        let name = document.getElementById("fullname");
        let cls = document.getElementById("class_name");
        if (!name.value.trim()) name.value = "Hết giờ (Chưa ghi tên)";
        if (!cls.value.trim()) cls.value = "Unknown";
        submitTest();
    }

    // --- HÀM TÍNH ĐIỂM & NỘP BÀI ---
    function submitTest() {
        const fullName = document.getElementById("fullname").value.trim();
        const className = document.getElementById("class_name").value.trim();
        const btn = document.getElementById("submit-btn");
        const notif = document.getElementById("notification");

        if (!fullName || !className) {
            alert("Vui lòng nhập đầy đủ Họ Tên và Lớp!");
            return;
        }

        // --- TÍNH ĐIỂM PHẦN 1 (0.25 điểm/câu) ---
        let scoreP1 = 0;
        for (let key in correctAnswersPart1) {
            let userOpt = document.querySelector(`input[name="${key}"]:checked`);
            if (userOpt && userOpt.value === correctAnswersPart1[key]) {
                scoreP1 += 0.25; // Sửa điểm tại đây
            }
        }

        // --- TÍNH ĐIỂM PHẦN 2 (Đúng Sai - Logic bậc thang) ---
        let scoreP2 = 0; 
        for (let qKey in correctAnswersPart2) {
            let correctSubCount = 0;
            let subAnswers = correctAnswersPart2[qKey];
            for (let subKey in subAnswers) {
                let inputName = `tf_${qKey}_${subKey}`;
                let userChoice = document.querySelector(`input[name="${inputName}"]:checked`);
                if (userChoice && userChoice.value === subAnswers[subKey]) {
                    correctSubCount++;
                }
            }
            if (correctSubCount === 1) scoreP2 += 0.1;
            else if (correctSubCount === 2) scoreP2 += 0.25;
            else if (correctSubCount === 3) scoreP2 += 0.5;
            else if (correctSubCount === 4) scoreP2 += 1.0;
        }

        // --- TÍNH ĐIỂM PHẦN 3 (Trả lời ngắn - 0.5 điểm/câu) ---
        let scoreP3 = 0;
        for (let key in correctAnswersPart3) {
            let userInput = document.querySelector(`input[name="sa_${key}"]`);
            if (userInput) {
                let userVal = userInput.value.trim().toLowerCase(); // Xóa khoảng trắng, về chữ thường
                let correctVal = correctAnswersPart3[key].toLowerCase();
                if (userVal === correctVal) {
                    scoreP3 += 0.5; // Sửa điểm tại đây
                }
            }
        }

        // --- TỔNG KẾT ---
        let totalScore = scoreP1 + scoreP2 + scoreP3;
        // Làm tròn 2 chữ số thập phân (ví dụ: 8.75)
        totalScore = totalScore.toFixed(2); 

        let finalString = `P1:${scoreP1} - P2:${scoreP2} - P3:${scoreP3} => Tổng: ${totalScore}`;

        btn.disabled = true;
        btn.innerText = "Đang gửi kết quả...";
        notif.style.display = "none";
        clearInterval(timerInterval);

        const formData = new FormData();
        formData.append("Họ và Tên", fullName);
        formData.append("Lớp", className);
        formData.append("Điểm số", finalString); // Gửi chuỗi chi tiết

        fetch(googleScriptURL, { method: 'POST', body: formData })
            .then(response => {
                notif.className = "success";
                notif.innerHTML = `✅ Nộp thành công!<br>Tổng điểm: <b>${totalScore}</b><br><small>(${finalString})</small>`;
                notif.style.display = "block";
                btn.innerText = "ĐÃ NỘP XONG";
                let inputs = document.querySelectorAll('input');
                inputs.forEach(input => input.disabled = true);
            })
            .catch(error => {
                console.error(error);
                notif.className = "error";
                notif.innerText = "⚠️ Lỗi đường truyền. Vui lòng báo giáo viên!";
                notif.style.display = "block";
                btn.disabled = false;
                btn.innerText = "NỘP LẠI";
            });
    }
