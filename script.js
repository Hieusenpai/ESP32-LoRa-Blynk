// URL API Google Sheets của bạn
const GOOGLE_SHEETS_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLhXqp5NAKv0GGjcyWFRwqaR0h_MbP1IWZTsnNS2ZJ-IQ1xfB-OkhBMLUrBlA7jtBeeReeYYqmeM2NDGL8RDrWZyCESM4ctYxAuKc2aM0lck0vMQhbx83KrwokGo8VWIOl8T6bOgvDVwIJfzgkxDjW8Cm07lhu-OfVVPoQcRcDCmQYt-nMz0BR3NIIP_wtCeK1IOCMlcNtWBOQSlYxSgVsFAztZwQxaJBxRISQZnnV6bMhlroOkXfUvq6QXe4RZarBUpgTb7sDW0vQLJ-0BwbFd_YLtatGz7tjhexMeb&lib=MAcBOElu6ndAv0Reinu6P_qbuyFllbNKS";

// Mở modal
function openHistoryModal() {
    const modal = document.getElementById('historyModal');
    modal.classList.add('active');
    loadHistoryLogs();
}

// Đóng modal
function closeHistoryModal(event) {
    if (!event || event.target.id === 'historyModal') {
        const modal = document.getElementById('historyModal');
        modal.classList.remove('active');
    }
}

// Đóng modal khi nhấn ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeHistoryModal();
    }
});

// Load và hiển thị logs từ Google Sheets
async function loadHistoryLogs() {
    const logList = document.getElementById('logList');
    
    // Hiển thị loading
    logList.innerHTML = '<div class="empty-message">⏳ Đang tải dữ liệu...</div>';
    
    try {
        const response = await fetch(GOOGLE_SHEETS_URL);
        const logs = await response.json();
        
        console.log("=== Dữ liệu từ Google Sheets ===");
        console.log("Số lượng bản ghi:", logs.length);
        console.log("Bản ghi đầu tiên:", logs[0]);
        
        // Kiểm tra nếu không có dữ liệu
        if (!logs || logs.length === 0) {
            logList.innerHTML = '<div class="empty-message">📭 Chưa có dữ liệu lịch sử!</div>';
            return;
        }
        
        // Lọc dữ liệu 1 tháng gần nhất
        const now = Date.now();
        const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
        
        const recentLogs = logs.filter(log => {
            const timestamp = log["Thời Gian"] || log.timestamp || log.date;
            if (!timestamp) return true;
            
            const logTime = new Date(timestamp).getTime();
            return logTime >= oneMonthAgo;
        });
        
        console.log("Số bản ghi sau khi lọc 1 tháng:", recentLogs.length);
        
        if (recentLogs.length === 0) {
            logList.innerHTML = '<div class="empty-message">📭 Không có dữ liệu trong 1 tháng gần nhất!</div>';
            return;
        }
        
        // Hiển thị dữ liệu
        logList.innerHTML = '';
        
        // Sắp xếp theo thời gian mới nhất
        recentLogs.sort((a, b) => {
            const timeA = new Date(a["Thời Gian"] || a.timestamp || 0).getTime();
            const timeB = new Date(b["Thời Gian"] || b.timestamp || 0).getTime();
            return timeB - timeA;
        });
        
        recentLogs.forEach((log, index) => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            
            // Format ngày giờ
            const timestamp = log["Thời Gian"] || new Date();
            const logDate = new Date(timestamp);
            const formattedDate = logDate.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            // Lấy giá trị từ các field - debug kỹ hơn
            console.log("=== DEBUG LOG ITEM ===");
            console.log("All keys:", Object.keys(log));
            console.log("Full log:", log);
            
            // Thử lấy giá trị nhiệt độ bằng nhiều cách
            const tempKey = Object.keys(log).find(key => key.includes("Nhiệt"));
            console.log("Found temp key:", tempKey);
            console.log("Temp value using found key:", log[tempKey]);
            
            const temp = Number(
                log[tempKey] ||
                log["Nhiệt độ"] || 
                log["Nhiệt độ(°C)"] || 
                log["temperature"] || 
                0
            ).toFixed(1);
            
            const hum = Number(
                log["Độ ẩm"] || 
                log["Độ ẩm(%)"] || 
                log["humidity"] || 
                0
            ).toFixed(1);
            
            const dust = Number(
                log["Bụi (Umg3)"] || 
                log["Bụi"] ||
                log["Bụi (µg/m³)"] || 
                log["dust"] || 
                0
            ).toFixed(1);
            
            const volt = Number(
                log["Điện áp"] || 
                log["Điện áp (V)"] || 
                log["voltage"] || 
                0
            ).toFixed(2);
            
            console.log("Final values - temp:", temp, "hum:", hum, "dust:", dust, "volt:", volt);
            
            logItem.innerHTML = `
                <div class="log-time">
                    🕐 ${formattedDate}
                </div>
                <div class="log-data">
                    <div class="log-data-item">
                        <span class="log-icon">🌡️</span>
                        <div>
                            <div class="log-label">Nhiệt độ</div>
                            <div class="log-value">${temp}°C</div>
                        </div>
                    </div>
                    <div class="log-data-item">
                        <span class="log-icon">💧</span>
                        <div>
                            <div class="log-label">Độ ẩm</div>
                            <div class="log-value">${hum}%</div>
                        </div>
                    </div>
                    <div class="log-data-item">
                        <span class="log-icon">💨</span>
                        <div>
                            <div class="log-label">Bụi</div>
                            <div class="log-value">${dust}</div>
                        </div>
                    </div>
                    <div class="log-data-item">
                        <span class="log-icon">⚡</span>
                        <div>
                            <div class="log-label">Điện áp</div>
                            <div class="log-value">${volt}V</div>
                        </div>
                    </div>
                </div>
            `;
            logList.appendChild(logItem);
        });
        
    } catch (error) {
        console.error("❌ Lỗi khi tải dữ liệu:", error);
        logList.innerHTML = '<div class="empty-message">❌ Lỗi khi tải dữ liệu: ' + error.message + '</div>';
    }
}

// ===== PHẦN CẬP NHẬT DỮ LIỆU THỜI GIAN THỰC =====

async function updateData() {
    try {
        // Lấy dữ liệu từ API Blynk: V0 = temp, V1 = hum, V2 = dust, V3 = voltage
        const url = "https://blynk.cloud/external/api/get?token=U5_wkAX9W8JnXjTHjMzerLFuh9KavAAF&v0&v1&v2&v3";

        const res = await fetch(url);
        const data = await res.json();
        
        console.log("Dữ liệu từ Blynk:", data);

        const temp = Number(data.v0);
        const hum = Number(data.v1);
        const dust = Number(data.v2);
        const volt = Number(data.v3);
        
        console.log("Nhiệt độ:", temp, "Độ ẩm:", hum, "Bụi:", dust, "Điện áp:", volt);

        // Cập nhật Nhiệt độ
        document.getElementById('temperature').textContent = temp.toFixed(1) + "°";
        document.getElementById('temp-progress').style.width = (temp / 40 * 100) + "%";
        const tempStatus = document.getElementById('temp-status');
        if (temp < 19) {
            tempStatus.textContent = "Lạnh";
            tempStatus.style.background = "rgba(59, 130, 246, 0.3)";
        } else if (temp >= 19 && temp <= 28) {
            tempStatus.textContent = "Bình thường";
            tempStatus.style.background = "rgba(34, 197, 94, 0.3)";
        } else {
            tempStatus.textContent = "Nóng";
            tempStatus.style.background = "rgba(239, 68, 68, 0.3)";
        }

        // Cập nhật Độ ẩm
        document.getElementById('humidity').textContent = hum.toFixed(1) + "%";
        document.getElementById('hum-progress').style.width = hum + "%";

        // Cập nhật Độ bụi
        document.getElementById('dust').textContent = dust.toFixed(1);
        document.getElementById('dust-progress').style.width = (dust / 150 * 100) + "%";
        const dustStatus = document.getElementById('dust-status');
        if (dust <= 50) {
            dustStatus.textContent = "Tốt";
            dustStatus.style.background = "rgba(34, 197, 94, 0.3)";
        } else if (dust <= 100) {
            dustStatus.textContent = "Trung bình";
            dustStatus.style.background = "rgba(251, 191, 36, 0.3)";
        } else {
            dustStatus.textContent = "Xấu";
            dustStatus.style.background = "rgba(239, 68, 68, 0.3)";
        }

        // Cập nhật Điện áp
        document.getElementById('voltage').textContent = volt.toFixed(2);
        document.getElementById('volt-progress').style.width = (volt / 20 * 100) + "%";

        // Cập nhật Thông tin phụ
        document.getElementById('feels-like').textContent = (temp + 2) + "°C";
        document.getElementById('aqi').textContent = Math.floor(dust * 1.5);

    } catch (err) {
        console.log("Lỗi API:", err);
    }
}

// Cập nhật dữ liệu mỗi 3 giây
setInterval(updateData, 3000);
updateData(); // Gọi ngay lần đầu
