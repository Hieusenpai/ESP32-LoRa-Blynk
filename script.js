// Lưu log trung bình mỗi giờ
let hourlyData = []; // Lưu tất cả dữ liệu trong giờ
let lastLogTime = 0;
const LOG_INTERVAL = 60 * 60 * 1000; // 1 giờ
const LOG_RETENTION = 2 * 24 * 60 * 60 * 1000; // 2 ngày

function collectData(temp, hum, dust, volt) {
    const now = Date.now();
    
    // Thêm dữ liệu vào mảng tạm
    hourlyData.push({
        timestamp: now,
        temperature: temp,
        humidity: hum,
        dust: dust,
        voltage: volt
    });
    
    // Kiểm tra đã đủ 1 giờ chưa
    if (now - lastLogTime >= LOG_INTERVAL && hourlyData.length > 0) {
        calculateAndSaveAverage();
        lastLogTime = now;
        hourlyData = []; // Reset dữ liệu cho giờ tiếp theo
    }
}

function calculateAndSaveAverage() {
    if (hourlyData.length === 0) return;
    
    // Tính trung bình
    const avgTemp = hourlyData.reduce((sum, d) => sum + d.temperature, 0) / hourlyData.length;
    const avgHum = hourlyData.reduce((sum, d) => sum + d.humidity, 0) / hourlyData.length;
    const avgDust = hourlyData.reduce((sum, d) => sum + d.dust, 0) / hourlyData.length;
    const avgVolt = hourlyData.reduce((sum, d) => sum + d.voltage, 0) / hourlyData.length;
    
    const now = Date.now();
    
    // Lấy log cũ từ localStorage
    let logs = JSON.parse(localStorage.getItem('sensorLogs') || '[]');
    
    // Thêm log trung bình mới
    logs.push({
        timestamp: now,
        date: new Date(now).toLocaleString('vi-VN'),
        temperature: Number(avgTemp.toFixed(1)),
        humidity: Number(avgHum.toFixed(1)),
        dust: Number(avgDust.toFixed(1)),
        voltage: Number(avgVolt.toFixed(2)),
        sampleCount: hourlyData.length // Số lượng mẫu đã lấy
    });
    
    // Xóa log cũ hơn 2 ngày
    const cutoffTime = now - LOG_RETENTION;
    logs = logs.filter(log => log.timestamp > cutoffTime);
    
    // Lưu lại
    localStorage.setItem('sensorLogs', JSON.stringify(logs));
    
    console.log(`✅ Đã lưu trung bình 1 giờ (${hourlyData.length} mẫu) lúc ${new Date(now).toLocaleString('vi-VN')}`);
    console.log(`📊 TB: Nhiệt độ: ${avgTemp.toFixed(1)}°C, Độ ẩm: ${avgHum.toFixed(1)}%, Bụi: ${avgDust.toFixed(1)}, Điện áp: ${avgVolt.toFixed(2)}V`);
}

function showLogHistory() {
    const logs = JSON.parse(localStorage.getItem('sensorLogs') || '[]');
    
    if (logs.length === 0) {
        alert('Chưa có dữ liệu lịch sử!');
        return;
    }
    
    let logText = '📜 LỊCH SỬ TRUNG BÌNH 2 NGÀY GẦN NHẤT\n';
    logText += '='.repeat(50) + '\n\n';
    
    logs.reverse().forEach((log, index) => {
        logText += `${logs.length - index}. ${log.date}\n`;
        logText += `   🌡️ TB Nhiệt độ: ${log.temperature}°C\n`;
        logText += `   💧 TB Độ ẩm: ${log.humidity}%\n`;
        logText += `   💨 TB Bụi: ${log.dust}\n`;
        logText += `   ⚡ TB Điện áp: ${log.voltage}V\n`;
        logText += `   📊 Số mẫu: ${log.sampleCount || 'N/A'}\n\n`;
    });
    
    logText += `\nTổng số: ${logs.length} bản ghi (trung bình mỗi giờ)`;
    
    alert(logText);
}

async function updateData() {
    try {
        // Lấy dữ liệu từ API Blynk: V0 = temp, V1 = hum, V2 = dust, V3 = voltage
        const url = "https://blynk.cloud/external/api/get?token=U5_wkAX9W8JnXjTHjMzerLFuh9KavAAF&v0&v1&v2&v3";

        const res = await fetch(url);
        const data = await res.json();
        
        // Kiểm tra dữ liệu trả về
        console.log("Dữ liệu từ Blynk:", data);

        const temp = Number(data.v0);
        const hum = Number(data.v1);
        const dust = Number(data.v2);
        const volt = Number(data.v3);
        
        console.log("Nhiệt độ:", temp, "Độ ẩm:", hum, "Bụi:", dust, "Điện áp:", volt);
        
        // Thu thập dữ liệu và tính trung bình mỗi giờ
        collectData(temp, hum, dust, volt);

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
        // Cập nhật trạng thái bụi
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
        document.getElementById('dew-point').textContent = Math.floor(temp * 0.7) + "°C";
        document.getElementById('aqi').textContent = Math.floor(dust * 1.5);

    } catch (err) {
        console.log("Lỗi API:", err);
    }
}

// Cập nhật dữ liệu mỗi 3 giây
setInterval(updateData, 3000);
updateData(); // Gọi ngay lần đầu
