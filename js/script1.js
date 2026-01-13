let timerInterval;
    let timeInSeconds = TIME_LIMIT * 60;

    // Tự động vẽ câu hỏi ra màn hình
    window.onload = function() {
        renderQuiz();
        startTimer();
    };

    function renderQuiz() {
        const container = document.getElementById("quiz-container");
        let html = "";
        let p1_title = false, p2_title = false, p3_title = false;

        questions.forEach((q, index) => {
            let qIndex = index + 1; // Tự động đánh số câu 1, 2, 3...
            
            // Tự động thêm tiêu đề phần
            if(q.type === 1 && !p1_title) { html += `<div class="part-title">PHẦN I: TRẮC NGHIỆM (0.25đ/câu)</div>`; p1_title = true; }
            if(q.type === 2 && !p2_title) { html += `<div class="part-title">PHẦN II: ĐÚNG SAI (Thang điểm bậc thang)</div>`; p2_title = true; }
            if(q.type === 3 && !p3_title) { html += `<div class="part-title">PHẦN III: TRẢ LỜI NGẮN (0.5đ/câu)</div>`; p3_title = true; }

            html += `<div class="question">`;
            html += `<div class="q-text">${q.text}</div>`;
            if(q.img) html += `<img src="${q.img}" width="300">`;

            // Xử lý Giao diện từng loại câu
            if (q.type === 1) { // Trắc nghiệm
                html += `<div class="options">`;
                const labels = ["A", "B", "C", "D"];
                q.options.forEach((opt, i) => {
                    html += `<label><input type="radio" name="q_${index}" value="${labels[i]}"> <b>${labels[i]}.</b> ${opt}</label>`;
                });
                html += `</div>`;
            } 
            else if (q.type === 2) { // Đúng sai
                html += `<div class="tf-container">`;
                q.sub_questions.forEach((sub, j) => {
                    html += `<div class="tf-row">
                                <div style="flex:1">${sub}</div>
                                <div class="tf-opts">
                                    <label><input type="radio" name="tf_${index}_${j}" value="true"> Đ</label>
                                    <label><input type="radio" name="tf_${index}_${j}" value="false"> S</label>
                                </div>
                             </div>`;
                });
                html += `</div>`;
            } 
            else if (q.type === 3) { // Trả lời ngắn
                html += `<input type="text" name="sa_${index}" placeholder="Nhập đáp án...">`;
            }
            html += `</div>`;
        });

        container.innerHTML = html;
        // Kích hoạt lại MathJax cho câu hỏi mới sinh ra
        if(window.MathJax) MathJax.typeset(); 
    }

    function startTimer() {
        const display = document.getElementById('countdown');
        const timerBox = document.getElementById('timer');
        timerInterval = setInterval(() => {
            let m = Math.floor(timeInSeconds / 60);
            let s = timeInSeconds % 60;
            display.textContent = (m<10?"0"+m:m) + ":" + (s<10?"0"+s:s);
            if (timeInSeconds < 60) timerBox.style.background = "#d32f2f";
            if (--timeInSeconds < 0) {
                clearInterval(timerInterval);
                submitTest(true);
            }
        }, 1000);
    }

    function submitTest(auto = false) {
        const fullName = document.getElementById("fullname").value.trim();
        const className = document.getElementById("class_name").value.trim();
        if (!auto && (!fullName || !className)) { alert("Vui lòng điền tên và lớp!"); return; }

        let scoreP1 = 0, scoreP2 = 0, scoreP3 = 0;

        questions.forEach((q, index) => {
            // Chấm điểm Phần 1
            if (q.type === 1) {
                let userOpt = document.querySelector(`input[name="q_${index}"]:checked`);
                if (userOpt && userOpt.value === q.correct) scoreP1 += 0.25;
            }
            // Chấm điểm Phần 2
            else if (q.type === 2) {
                let countCorrect = 0;
                q.correct.forEach((ans, j) => {
                    let userOpt = document.querySelector(`input[name="tf_${index}_${j}"]:checked`);
                    if (userOpt && userOpt.value === ans) countCorrect++;
                });
                if(countCorrect===1) scoreP2+=0.1;
                if(countCorrect===2) scoreP2+=0.25;
                if(countCorrect===3) scoreP2+=0.5;
                if(countCorrect===4) scoreP2+=1.0;
            }
            // Chấm điểm Phần 3
            else if (q.type === 3) {
                let userInp = document.querySelector(`input[name="sa_${index}"]`);
                if (userInp) {
                    let val = userInp.value.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
                    let corr = q.correct.toLowerCase().replace(/\s+/g, '').replace(',', '.');
                    if (val === corr) scoreP3 += 0.5;
                }
            }
        });

        let total = (scoreP1 + scoreP2 + scoreP3).toFixed(2);
        let detail = `P1:${scoreP1} - P2:${scoreP2} - P3:${scoreP3}`;
        
        const btn = document.getElementById("submit-btn");
        const notif = document.getElementById("notification");
        btn.disabled = true; btn.innerText = "Đang nộp...";
        clearInterval(timerInterval);

        const fd = new FormData();
        fd.append("Họ và Tên", fullName || "Không tên");
        fd.append("Lớp", className || "Unknown");
        fd.append("Điểm số", `${detail} => Tổng: ${total}`);

        fetch(googleScriptURL, { method: 'POST', body: fd })
            .then(() => {
                notif.className = "success";
                // ĐÃ SỬA ĐOẠN NÀY ĐỂ HIỆN CHI TIẾT
                notif.innerHTML = `✅ Nộp bài thành công!<br>
                                   <b>Tổng điểm: ${total}</b><br>
                                   <small>(${detail})</small>`;
                notif.style.display = "block";
                btn.innerText = "ĐÃ NỘP";
            })
            .catch(() => alert("Lỗi đường truyền!"));
    }
