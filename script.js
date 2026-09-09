import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyA53x0EHDN4HeJqbmwN98Lb9V-0YG6k0Ic",
  authDomain: "olymp-portal.firebaseapp.com",
  databaseURL: "https://olymp-portal-default-rtdb.firebaseio.com",
  projectId: "olymp-portal",
  storageBucket: "olymp-portal.firebasestorage.app",
  messagingSenderId: "310726558368",
  appId: "1:310726558368:web:b7359a8f77d221097effc5",
  measurementId: "G-DC3QGQKPVJ"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadContent = document.getElementById('uploadContent');
const previewContainer = document.getElementById('previewContainer');
const imageGallery = document.getElementById('imageGallery');
const clearBtn = document.getElementById('clearBtn');
const addMoreBtn = document.getElementById('addMoreBtn');
const extractBtn = document.getElementById('extractBtn');
const rawTextInput = document.getElementById('rawTextInput');
const loadingState = document.getElementById('loadingState');
const finalState = document.getElementById('finalState');
const loadingStatus = document.getElementById('loadingStatus');
const processingProgress = document.getElementById('processingProgress');
const extractedText = document.getElementById('extractedText');
const copyBtn = document.getElementById('copyBtn');
const openNewTabBtn = document.getElementById('openNewTabBtn');
const tabPreview = document.getElementById('tabPreview');
const tabCode = document.getElementById('tabCode');
const previewPane = document.getElementById('previewPane');
const codePane = document.getElementById('codePane');
const livePreviewFrame = document.getElementById('livePreviewFrame');
const downloadExcelBtn = document.getElementById('downloadExcelBtn');
const taskCodeBtn = document.getElementById('taskCodeBtn');
const taskOcrBtn = document.getElementById('taskOcrBtn');
const taskExcelBtn = document.getElementById('taskExcelBtn');
const heroTitle = document.getElementById('heroTitle');
const heroDesc = document.getElementById('heroDesc');
const btnIcon = document.getElementById('btnIcon');
const btnText = document.getElementById('btnText');
const generationSettings = document.getElementById('generationSettings');
let currentImageFiles = []; 
let currentObjectURLs = []; 
let currentTaskType = 'code';
let lastExcelBase64 = null;
let lastExcelFilename = null; 
async function compressImage(file, maxWidth = 1600, maxHeight = 1600) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    resolve(new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                }, 'image/jpeg', 0.7); 
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}
uploadArea.addEventListener('click', (e) => {
    if (currentImageFiles.length === 0 && e.target !== clearBtn && !clearBtn.contains(e.target)) {
        fileInput.click();
    }
});
uploadArea.addEventListener('keydown', (e) => {
    if (currentImageFiles.length === 0 && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        fileInput.click();
    }
});
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        if (currentImageFiles.length + e.dataTransfer.files.length > 10) {
            alert('Maximum 10 images allowed.');
            return;
        }
        handleFiles(e.dataTransfer.files);
    }
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
        if (currentImageFiles.length + e.target.files.length > 10) {
            alert('Maximum 10 images allowed.');
            return;
        }
        handleFiles(e.target.files);
    }
});
function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        const isWord = file.type === 'application/msword' || file.name.endsWith('.doc') || file.name.endsWith('.docx');
        if (!isImage && !isPdf && !isWord) {
            alert('Please upload valid image, PDF, or Word files only.');
            continue;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('One of the files is too large. Maximum size is 10MB per file.');
            continue;
        }
        currentImageFiles.push(file);
        if (isImage) {
            const url = URL.createObjectURL(file);
            currentObjectURLs.push(url);
            const img = document.createElement('img');
            img.src = url;
            img.className = 'gallery-img';
            img.alt = 'Uploaded Document';
            imageGallery.appendChild(img);
        } else {
            const docPreview = document.createElement('div');
            docPreview.className = 'gallery-img doc-preview';
            docPreview.innerHTML = `
                <span class="material-symbols-rounded" style="font-size: 32px; margin-bottom: 8px;">description</span>
                <span style="font-size: 12px; text-align: center; word-break: break-all; max-width: 80px;">${file.name}</span>
            `;
            imageGallery.appendChild(docPreview);
        }
    }
    if (currentImageFiles.length > 0) {
        uploadContent.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        uploadArea.classList.add('has-image');
    }
    extractBtn.disabled = false;
}
addMoreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});
clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentImageFiles = [];
    fileInput.value = '';
    currentObjectURLs.forEach(url => URL.revokeObjectURL(url));
    currentObjectURLs = [];
    imageGallery.innerHTML = '';
    previewContainer.classList.add('hidden');
    uploadContent.classList.remove('hidden');
    extractBtn.disabled = rawTextInput.value.trim().length === 0;
    uploadArea.classList.remove('has-image');
    finalState.classList.add('hidden');
    loadingState.classList.add('hidden');
    extractedText.value = '';
});
rawTextInput.addEventListener('input', () => {
    extractBtn.disabled = (currentImageFiles.length === 0 && rawTextInput.value.trim().length === 0);
});
extractBtn.addEventListener('click', async () => {
    const rawTextValue = rawTextInput.value.trim();
    if (currentImageFiles.length === 0 && !rawTextValue) {
        alert("Please upload a file or paste some text first.");
        return;
    }
    finalState.classList.add('hidden');
    loadingState.classList.remove('hidden');
    extractBtn.disabled = true;
    processingProgress.style.width = '30%';
    loadingStatus.textContent = 'Compressing images...';
    try {
        const formData = new FormData();
        const processedFiles = await Promise.all(currentImageFiles.map(file => {
            if (file.type.startsWith('image/')) {
                return compressImage(file);
            }
            return Promise.resolve(file); 
        }));
        processedFiles.forEach(file => {
            formData.append('images', file);
        });
        if (rawTextValue) {
            formData.append('rawText', rawTextValue);
        }
        formData.append('mode', document.getElementById('generationMode').value);
        formData.append('taskType', currentTaskType);
        processingProgress.style.width = '70%';
        loadingStatus.textContent = 'Generating...';
        const response = await fetch('https://vision-backend-api.onrender.com', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Server returned an error');
        }
        processingProgress.style.width = '100%';
        loadingStatus.textContent = 'Done!';
        loadingState.classList.add('hidden');
        finalState.classList.remove('hidden');
        if (data.excelBase64 && data.jsonData) {
            const headers = Object.keys(data.jsonData[0] || {});
            let tableHTML = `
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; background: #fff; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f4f4f4; font-weight: bold; position: sticky; top: 0; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    tr:hover { background-color: #f1f1f1; }
                </style>
                <h2>Data Preview</h2>
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${data.jsonData.map(row => `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            `;
            livePreviewFrame.srcdoc = tableHTML;
            extractedText.value = JSON.stringify(data.jsonData, null, 2);
            tabPreview.style.display = 'block';
            tabPreview.click();
            downloadExcelBtn.style.display = 'inline-flex';
            openNewTabBtn.style.display = 'none';
            lastExcelBase64 = data.excelBase64;
            lastExcelFilename = data.filename || 'extracted_data.xlsx';
        } else if (currentTaskType === 'ocr') {
            extractedText.value = data.text || 'No text extracted.';
            tabCode.click();
        } else {
            extractedText.value = data.text;
            livePreviewFrame.srcdoc = data.text;
            const generatedWindow = window.open('about:blank', '_blank');
            if (generatedWindow) {
                generatedWindow.document.write(data.text);
                generatedWindow.document.close();
            }
            tabPreview.click();
        }
    } catch (err) {
        console.error('OCR Error:', err);
        alert(`Extraction failed: ${err.message}`);
        loadingState.classList.add('hidden');
    } finally {
        extractBtn.disabled = false;
    }
});
copyBtn.addEventListener('click', async () => {
    if(!extractedText.value) return;
    try {
        await navigator.clipboard.writeText(extractedText.value);
        const icon = copyBtn.querySelector('span');
        icon.textContent = 'check';
        icon.style.color = '#00F260';
        setTimeout(() => {
            icon.textContent = 'content_copy';
            icon.style.color = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text to clipboard. Please select and copy manually.');
    }
});
tabPreview.addEventListener('click', () => {
    tabPreview.classList.add('active');
    tabCode.classList.remove('active');
    previewPane.classList.remove('hidden');
    codePane.classList.add('hidden');
});
tabCode.addEventListener('click', () => {
    tabCode.classList.add('active');
    tabPreview.classList.remove('active');
    codePane.classList.remove('hidden');
    previewPane.classList.add('hidden');
});
openNewTabBtn.addEventListener('click', () => {
    if(!extractedText.value) return;
    const newWindow = window.open();
    newWindow.document.write(extractedText.value);
    newWindow.document.close();
});
downloadExcelBtn.addEventListener('click', () => {
    if (!lastExcelBase64) return;
    const binaryString = window.atob(lastExcelBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = lastExcelFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
taskCodeBtn.addEventListener('click', () => {
    if (currentTaskType !== 'code') clearBtn.click();
    currentTaskType = 'code';
    taskCodeBtn.classList.add('active');
    taskOcrBtn.classList.remove('active');
    taskExcelBtn.classList.remove('active');
    downloadExcelBtn.style.display = 'none';
    heroTitle.innerHTML = 'Generate Code from <span>Sketches</span>';
    heroDesc.textContent = 'Upload a photo of your hand-drawn wireframe and let the neural network convert it into a fully functional HTML/CSS website.';
    generationSettings.style.display = 'flex';
    btnText.textContent = 'Generate Code';
    btnIcon.textContent = 'code_blocks';
    tabPreview.style.display = 'block';
    openNewTabBtn.style.display = 'block';
    tabCode.textContent = 'Code';
    extractedText.style.fontFamily = "'Courier New', Courier, monospace";
});
taskOcrBtn.addEventListener('click', () => {
    if (currentTaskType !== 'ocr') clearBtn.click();
    currentTaskType = 'ocr';
    taskOcrBtn.classList.add('active');
    taskCodeBtn.classList.remove('active');
    taskExcelBtn.classList.remove('active');
    downloadExcelBtn.style.display = 'none';
    heroTitle.innerHTML = 'Extract <span>Text</span> from Notes';
    heroDesc.textContent = 'Upload a photo of handwriting, notes, or printed text, and the neural network will digitize it instantly with high accuracy.';
    generationSettings.style.display = 'none'; 
    btnText.textContent = 'Extract Text';
    btnIcon.textContent = 'text_fields';
    tabCode.click();
    tabPreview.style.display = 'none';
    openNewTabBtn.style.display = 'none';
    tabCode.textContent = 'Text';
    extractedText.style.fontFamily = "inherit"; 
});
taskExcelBtn.addEventListener('click', () => {
    if (currentTaskType !== 'excel') clearBtn.click();
    currentTaskType = 'excel';
    taskExcelBtn.classList.add('active');
    taskCodeBtn.classList.remove('active');
    taskOcrBtn.classList.remove('active');
    heroTitle.innerHTML = 'Data to <span>Excel</span>';
    heroDesc.textContent = 'Upload receipts, tables, or documents. The AI will extract the structured data and generate a downloadable Excel (.xlsx) file.';
    generationSettings.style.display = 'none';
    btnText.textContent = 'Generate Excel';
    btnIcon.textContent = 'download';
    tabCode.click();
    tabPreview.style.display = 'none';
    openNewTabBtn.style.display = 'none';
    downloadExcelBtn.style.display = 'none';
    tabCode.textContent = 'JSON Data';
    extractedText.style.fontFamily = "inherit";
});
document.querySelectorAll('.nav-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });
});
const authModal = document.getElementById('authModal');
const navLoginBtn = document.getElementById('navLoginBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const profileDropdown = document.getElementById('profileDropdown');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileLogoutBtn = document.getElementById('profileLogoutBtn');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authSwitchLink = document.getElementById('authSwitchLink');
const authSwitchText = document.getElementById('authSwitchText');
const authHeaderTitle = document.querySelector('.auth-header h2');
const authHeaderDesc = document.querySelector('.auth-header p');
let isSignUpMode = false;
closeAuthBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
});
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.classList.add('hidden');
    }
});
authSwitchLink.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        authHeaderTitle.textContent = 'Create an Account';
        authHeaderDesc.textContent = 'Sign up to access premium features.';
        authSubmitBtn.textContent = 'Sign Up';
        authSwitchText.textContent = 'Already have an account?';
        authSwitchLink.textContent = 'Sign in';
    } else {
        authHeaderTitle.textContent = 'Welcome Back';
        authHeaderDesc.textContent = 'Sign in to access premium features.';
        authSubmitBtn.textContent = 'Sign In';
        authSwitchText.textContent = "Don't have an account?";
        authSwitchLink.textContent = 'Sign up';
    }
});
const googleLoginBtn = document.getElementById('googleLoginBtn');
googleLoginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        authModal.classList.add('hidden');
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = 'Loading...';
    try {
        if (isSignUpMode) {
            await createUserWithEmailAndPassword(auth, email, password);
            alert('Account created successfully!');
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        authModal.classList.add('hidden');
    } catch (err) {
        console.error(err);
        alert(err.message);
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
    }
});
onAuthStateChanged(auth, (user) => {
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        navLoginBtn.innerHTML = `<span class="material-symbols-rounded">account_circle</span> ${displayName}`;
        navLoginBtn.style.background = 'rgba(0, 242, 96, 0.1)';
        navLoginBtn.style.borderColor = 'rgba(0, 242, 96, 0.3)';
        navLoginBtn.style.color = 'var(--gradient-1)';
        navLoginBtn.style.display = 'flex';
        navLoginBtn.style.alignItems = 'center';
        navLoginBtn.style.gap = '8px';
        profileName.textContent = displayName;
        profileEmail.textContent = user.email;
        navLoginBtn.onclick = () => {
            profileDropdown.classList.toggle('hidden');
        };
        profileLogoutBtn.onclick = async () => {
            await signOut(auth);
            location.reload();
        };
    } else {
        navLoginBtn.textContent = 'Sign In';
        navLoginBtn.style.background = '';
        navLoginBtn.style.borderColor = '';
        navLoginBtn.style.color = '';
        navLoginBtn.style.display = '';
        navLoginBtn.style.alignItems = '';
        navLoginBtn.style.gap = '';
        profileDropdown.classList.add('hidden');
        navLoginBtn.onclick = () => {
            authModal.classList.remove('hidden');
        };
    }
});
document.addEventListener('click', (e) => {
    if (!navLoginBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.add('hidden');
    }
});
