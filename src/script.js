let qrcode = null;
let isQRGenerated = false;
let history = [];

// Function to show the loader
function showLoader() {
  document.getElementById('loader').style.display = 'block';
}

// Function to hide the loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

// Function to display toast messages
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = document.createElement('i');
  icon.className = type === 'success'
    ? 'fas fa-check-circle'
    : type === 'error'
      ? 'fas fa-exclamation-circle'
      : type === 'warning'
        ? 'fas fa-exclamation-triangle'
        : 'fas fa-info-circle';

  const messageElement = document.createElement('span');
  messageElement.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.className = 'toast-close';
  closeButton.onclick = () => {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  };

  toast.appendChild(icon);
  toast.appendChild(messageElement);
  toast.appendChild(closeButton);

  const container = document.querySelector('.toast-container');
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 5000);
}

// Function to generate the QR Code
function generateQRCode(text) {
  document.getElementById('qrcode').innerHTML = '';

  if (qrcode === null) {
    qrcode = new QRCode("qrcode", {
      text: text,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  } else {
    qrcode.clear();
    qrcode.makeCode(text);
  }

  setTimeout(() => {
    const qrCodeImg = document.querySelector('#qrcode img');
    if (qrCodeImg) {
      const downloadLink = document.getElementById('download-link');
      downloadLink.href = qrCodeImg.src;
      downloadLink.download = 'qrcode.png';
      downloadLink.style.pointerEvents = 'auto';

      const timestamp = new Date().toLocaleString();
      history.push({
        content: text,
        timestamp: timestamp,
        source: 'Generated in QR Code Studio'
      });
      updateHistory();
    } else {
      console.error("Error: QR Code image not found.");
    }
  }, 500);
}

// Function to extract the domain from a URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return null;
  }
}

// Function to update the QR Code history
function updateHistory() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';

  history.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <p><strong>Content:</strong> ${item.content}</p>
      <p><strong>Time:</strong> ${item.timestamp}</p>
      <p><strong>${item.source === 'Generated in QR Code Studio' ? 'Source' : 'Destination'}:</strong> ${item.source}</p>
      <hr>
    `;
    historyList.appendChild(historyItem);
  });

  localStorage.setItem('qrHistory', JSON.stringify(history));
}

// Function to clear the history
function clearHistory() {
  history = [];
  updateHistory();
  localStorage.removeItem('qrHistory');
  showToast('History cleared successfully!', 'success');
}

// Function to load the saved history
function loadHistory() {
  const savedHistory = localStorage.getItem('qrHistory');
  if (savedHistory) {
    history = JSON.parse(savedHistory);
    updateHistory();
  }
}

// Function to read the content of a QR Code from an image
function readQRCode(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          resolve(code.data);
        } else {
          reject(new Error('No QR Code found in the image.'));
        }
      };
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Function to animate sections when scrolling the page
function animateSections() {
  const sections = document.querySelectorAll('section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(section => {
    observer.observe(section);
  });
}

// Function to set up the drag and drop area
function setupDragAndDrop() {
  const dragDropArea = document.getElementById('drag-drop-area');
  const fileInput = document.getElementById('qr-input');

  dragDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragDropArea.classList.add('dragover');
  });

  dragDropArea.addEventListener('dragleave', () => {
    dragDropArea.classList.remove('dragover');
  });

  dragDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDropArea.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  });

  dragDropArea.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  });
}

// Function to process the QR Code image file
async function handleFile(file) {
  const dragDropArea = document.getElementById('drag-drop-area');
  dragDropArea.classList.add('loading');

  showLoader();
  try {
    const result = await readQRCode(file);
    const readerResult = document.getElementById('reader-result');
    readerResult.textContent = `QR Code Content: ${result}`;
    readerResult.classList.remove('error');
    readerResult.classList.add('visible');

    showToast('QR Code read successfully!', 'success');

    const timestamp = new Date().toLocaleString();
    const destination = extractDomain(result) || result;
    history.push({
      content: result,
      timestamp: timestamp,
      source: destination
    });
    updateHistory();
  } catch (error) {
    console.error('Error reading QR Code:', error);
    const readerResult = document.getElementById('reader-result');
    readerResult.textContent = 'Error reading QR Code.';
    readerResult.classList.add('error');
    readerResult.classList.add('visible');
    showToast(error.message || 'Error reading QR Code', 'error');
  } finally {
    dragDropArea.classList.remove('loading');
    hideLoader();
  }
}

// Project initialization
document.addEventListener('DOMContentLoaded', () => {
  animateSections();
  loadHistory();
  setupDragAndDrop();

  document.getElementById('generate-btn').addEventListener('click', () => {
    const generateBtn = document.getElementById('generate-btn');
    const text = document.getElementById('qr-text').value;

    if (isQRGenerated) {
      showToast('You have already generated a QR Code. Go back to generate another.', 'warning');
      return;
    }

    if (text) {
      generateBtn.disabled = true;
      generateBtn.style.opacity = '0.7';

      showLoader();
      setTimeout(() => {
        generateQRCode(text);
        const qrResult = document.getElementById('qr-result');
        qrResult.style.display = 'block';

        document.getElementById('reset-btn').style.display = 'inline-block';

        hideLoader();
        showToast('QR Code generated successfully!', 'success');

        isQRGenerated = true;

        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
      }, 1000);
    } else {
      showToast('Please enter a text or URL', 'error');
    }
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (qrcode !== null) {
      qrcode.clear();
      qrcode = null;
    }

    document.getElementById('qrcode').innerHTML = '';

    const qrResult = document.getElementById('qr-result');
    qrResult.style.display = 'none';

    document.getElementById('qr-text').value = '';

    document.getElementById('reset-btn').style.display = 'none';

    showToast('QR Code reset successfully!', 'success');

    isQRGenerated = false;
  });

  document.getElementById('download-link').addEventListener('click', (event) => {
    const qrCodeImg = document.querySelector('#qrcode img');
    if (!qrCodeImg) {
      event.preventDefault();
      showToast('No QR Code generated for download.', 'error');
    } else {
      const link = document.createElement('a');
      link.href = qrCodeImg.src;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  });

  document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
});

// Effect of changing header color when scrolling the page
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {
    header.style.backgroundColor = 'rgba(108, 99, 255, 0.9)';
  } else {
    header.style.backgroundColor = 'var(--primary-color)';
  }
});