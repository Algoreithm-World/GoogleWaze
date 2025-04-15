// Main JavaScript for the Accessibility Assistant Web App
document.addEventListener('DOMContentLoaded', function() {
    // ---- SHARED VARIABLES ----
    const synth = window.speechSynthesis;
    let utterance = null;

    // ---- INITIALIZATION ----
    initAccessibilityPreferences();
    setupTabNavigation();
    setupDarkModeToggle();
    initTextToSpeech();
    initSpeechToText();
    initDyslexicText();
    initImageDescription();

    // ---- ACCESSIBILITY PREFERENCES ----
    function initAccessibilityPreferences() {
        // Show the accessibility modal on first visit
        if (!localStorage.getItem('accessibilityPreferencesSeen')) {
            const accessibilityModal = new bootstrap.Modal(document.getElementById('accessibilityModal'));
            accessibilityModal.show();
            localStorage.setItem('accessibilityPreferencesSeen', 'true');
        } else {
            // Load saved preferences
            loadAccessibilityPreferences();
        }

        // Listen for save button click
        document.getElementById('savePreferences').addEventListener('click', function() {
            saveAccessibilityPreferences();
            const accessibilityModal = bootstrap.Modal.getInstance(document.getElementById('accessibilityModal'));
            if (accessibilityModal) {
                accessibilityModal.hide();
            }
        });

        // Add skip to content link
        addSkipToContentLink();
    }

    function saveAccessibilityPreferences() {
        const screenReaderEnabled = document.getElementById('screenReaderOption').checked;
        const highContrastEnabled = document.getElementById('highContrastOption').checked;
        const darkModeEnabled = document.getElementById('darkModeOption').checked;
        const textSize = document.getElementById('textSizeRange').value;

        const preferences = {
            screenReader: screenReaderEnabled,
            highContrast: highContrastEnabled,
            darkMode: darkModeEnabled,
            textSize: textSize
        };

        localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
        applyAccessibilityPreferences(preferences);
    }

    function loadAccessibilityPreferences() {
        const preferencesString = localStorage.getItem('accessibilityPreferences');
        if (preferencesString) {
            const preferences = JSON.parse(preferencesString);

            // Update form controls
            document.getElementById('screenReaderOption').checked = preferences.screenReader;
            document.getElementById('highContrastOption').checked = preferences.highContrast;

            // Dark mode might not exist in older preferences
            if (preferences.hasOwnProperty('darkMode')) {
                document.getElementById('darkModeOption').checked = preferences.darkMode;
            }

            document.getElementById('textSizeRange').value = preferences.textSize;

            // Apply the preferences
            applyAccessibilityPreferences(preferences);
        }
    }

    function applyAccessibilityPreferences(preferences) {
        // High contrast mode
        if (preferences.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }

        // Text size
        document.body.classList.remove('text-size-120', 'text-size-140', 'text-size-160', 'text-size-180', 'text-size-200');
        if (preferences.textSize > 100) {
            document.body.classList.add(`text-size-${preferences.textSize}`);
        }

        // Dark mode
        if (preferences.hasOwnProperty('darkMode')) {
            setDarkMode(preferences.darkMode);
        }

        // Screen reader enhancements
        if (preferences.screenReader) {
            enableScreenReaderEnhancements();
        }
    }

    function enableScreenReaderEnhancements() {
        // Add ARIA labels to elements without them
        const elements = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        elements.forEach(element => {
            if (element.innerText) {
                element.setAttribute('aria-label', element.innerText.trim());
            }
        });

        // Add improved focus styles
        document.body.classList.add('keyboard-focus');

        // Create screen reader announcer if it doesn't exist
        if (!document.getElementById('sr-announcer')) {
            const announcer = document.createElement('div');
            announcer.id = 'sr-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            document.body.appendChild(announcer);

            // Announce that screen reader mode is active
            setTimeout(() => {
                announceToScreenReader("Screen reader mode is now active. Navigation and content will be optimized for screen readers.");
            }, 1000);
        }

        // Add additional ARIA labels to important interactive elements
        document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])').forEach(link => {
            if (link.innerText) {
                link.setAttribute('aria-label', link.innerText.trim());
            }
        });

        // Enhance form controls with better labels
        document.querySelectorAll('input, select, textarea').forEach(input => {
            if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                const label = document.querySelector(`label[for="${input.id}"]`);
                if (label) {
                    input.setAttribute('aria-labelledby', label.id || `label-${input.id}`);
                    if (!label.id) {
                        label.id = `label-${input.id}`;
                    }
                }
            }
        });
    }

    function addSkipToContentLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.className = 'skip-to-content';
        skipLink.textContent = 'Skip to content';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    function announceToScreenReader(message) {
        // Direct announcement regardless of preference setting for critical screen reader functionality
        let announcer = document.getElementById('sr-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'sr-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            document.body.appendChild(announcer);
        }

        // Clear and then set the content to ensure it's announced even when the message hasn't changed
        announcer.textContent = '';

        // Small delay to ensure the empty-and-refill technique works
        setTimeout(() => {
            announcer.textContent = message;
            console.log('Screen reader announcement:', message);
        }, 50);
    }

    // ---- DARK MODE TOGGLE ----
    function setupDarkModeToggle() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', function() {
                // Toggle the theme
                const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
                setDarkMode(!isDarkMode);

                // Update the toggle button icon
                updateDarkModeToggleIcon(!isDarkMode);

                // Save to preferences
                const preferencesString = localStorage.getItem('accessibilityPreferences');
                if (preferencesString) {
                    const preferences = JSON.parse(preferencesString);
                    preferences.darkMode = !isDarkMode;
                    localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
                }
            });

            // Set initial state based on user preference or system preference
            const savedPreferences = JSON.parse(localStorage.getItem('accessibilityPreferences') || '{}');
            if (savedPreferences.hasOwnProperty('darkMode')) {
                setDarkMode(savedPreferences.darkMode);
                updateDarkModeToggleIcon(savedPreferences.darkMode);
            } else {
                // Check if user has system dark mode preference
                const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setDarkMode(prefersDarkMode);
                updateDarkModeToggleIcon(prefersDarkMode);
            }
        }
    }

    function setDarkMode(isDarkMode) {
        document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    }

    function updateDarkModeToggleIcon(isDarkMode) {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.innerHTML = isDarkMode ?
                '<i class="fas fa-sun"></i>' :
                '<i class="fas fa-moon"></i>';
            darkModeToggle.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }

    // ---- TAB NAVIGATION ----
    function setupTabNavigation() {
        // Add click event listeners to tab links and feature buttons
        const tabLinks = document.querySelectorAll('.nav-link, .feature-button, #start-button');
        tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                // Get the target tab ID from the href attribute
                const targetId = this.getAttribute('href').substring(1);
                showTab(targetId);
            });
        });

        // Check if URL has a hash and show that tab
        if (window.location.hash) {
            const targetId = window.location.hash.substring(1);
            showTab(targetId);
        }
    }

    function showTab(tabId) {
        // Smoothly hide all tabs
        document.querySelectorAll('.tab-pane').forEach(tab => {
            tab.classList.remove('show', 'active');
        });

        // Show the selected tab with a slight delay for transition effect
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            // Small delay to allow fade out transition
            setTimeout(() => {
                targetTab.classList.add('show', 'active');
            }, 50);

            // Update URL hash without scrolling
            history.pushState(null, null, `#${tabId}`);

            // Update active state in navigation with smooth animation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${tabId}`) {
                    link.classList.add('active');
                    // Optional: Subtle animation for the active tab indicator
                    link.style.transition = 'all 0.3s ease';
                }
            });

            // Announce tab change to screen reader
            announceToScreenReader(`${tabId.replace('-', ' ')} tab displayed`);
        }
    }

    // ---- TEXT TO SPEECH ----
    function initTextToSpeech() {
        const ttsElements = {
            textInput: document.getElementById('textInput'),
            voiceSelect: document.getElementById('voiceSelect'),
            rateRange: document.getElementById('rateRange'),
            pitchRange: document.getElementById('pitchRange'),
            rateValue: document.getElementById('rateValue'),
            pitchValue: document.getElementById('pitchValue'),
            playButton: document.getElementById('playButton'),
            pauseButton: document.getElementById('pauseButton'),
            stopButton: document.getElementById('stopButton'),
            sampleButtons: document.querySelectorAll('.sample-text')
        };

        // Exit if elements don't exist
        if (!ttsElements.textInput) return;

        // Populate voice list
        populateVoiceList();

        // Update voices when they're loaded (for Chrome)
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        // Set up event listeners
        ttsElements.rateRange.addEventListener('input', function() {
            ttsElements.rateValue.textContent = this.value;
        });

        ttsElements.pitchRange.addEventListener('input', function() {
            ttsElements.pitchValue.textContent = this.value;
        });

        ttsElements.sampleButtons.forEach(button => {
            button.addEventListener('click', function() {
                ttsElements.textInput.value = this.getAttribute('data-text');
            });
        });

        ttsElements.playButton.addEventListener('click', function() {
            if (synth.speaking) {
                synth.cancel();
            }

            const text = ttsElements.textInput.value.trim();
            if (!text) {
                alert('Please enter text to speak.');
                return;
            }

            utterance = new SpeechSynthesisUtterance(text);

            // Set voice
            const voices = synth.getVoices();
            const selectedVoice = ttsElements.voiceSelect.selectedIndex;
            if (selectedVoice >= 0 && selectedVoice < voices.length) {
                utterance.voice = voices[selectedVoice];
            }

            // Set rate and pitch
            utterance.rate = parseFloat(ttsElements.rateRange.value);
            utterance.pitch = parseFloat(ttsElements.pitchRange.value);

            // Event handlers
            utterance.onstart = function() {
                ttsElements.playButton.disabled = true;
                ttsElements.pauseButton.disabled = false;
                ttsElements.stopButton.disabled = false;
            };

            utterance.onend = function() {
                resetTtsButtons();
            };

            utterance.onerror = function(event) {
                console.error('SpeechSynthesis Error:', event.error);
                resetTtsButtons();
                alert('An error occurred while speaking. Please try again.');
            };

            synth.speak(utterance);
        });

        ttsElements.pauseButton.addEventListener('click', function() {
            if (synth.speaking && !synth.paused) {
                synth.pause();
                this.innerHTML = '<i class="fas fa-play me-2"></i>Resume';
            } else if (synth.paused) {
                synth.resume();
                this.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';
            }
        });

        ttsElements.stopButton.addEventListener('click', function() {
            if (synth.speaking) {
                synth.cancel();
                resetTtsButtons();
            }
        });

        // Initialize button states
        resetTtsButtons();

        function populateVoiceList() {
            const voices = synth.getVoices();
            ttsElements.voiceSelect.innerHTML = '';

            voices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                option.setAttribute('data-lang', voice.lang);
                option.setAttribute('data-name', voice.name);
                option.value = index;
                ttsElements.voiceSelect.appendChild(option);
            });

            // Select a default voice (usually the first one)
            if (voices.length > 0) {
                ttsElements.voiceSelect.selectedIndex = 0;
            }
        }

        function resetTtsButtons() {
            ttsElements.playButton.disabled = false;
            ttsElements.pauseButton.disabled = true;
            ttsElements.stopButton.disabled = true;
            ttsElements.pauseButton.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';
        }
    }

    // ---- SPEECH TO TEXT ----
    function initSpeechToText() {
        // Check if browser supports Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            const sttCard = document.querySelector('#speech-to-text .card-body');
            if (sttCard) {
                sttCard.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Sorry, your browser doesn't support Speech Recognition. Please try using Chrome, Edge, or Safari.
                    </div>
                `;
            }
            return;
        }

        const sttElements = {
            transcript: document.getElementById('transcript'),
            startButton: document.getElementById('startButton'),
            stopButton: document.getElementById('stt-stopButton'),
            copyButton: document.getElementById('copyButton'),
            clearButton: document.getElementById('clearButton'),
            languageSelect: document.getElementById('languageSelect'),
            statusIndicator: document.getElementById('status-indicator')
        };

        // Exit if elements don't exist
        if (!sttElements.transcript) return;

        // Initialize Speech Recognition
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        // Variables
        let isRecording = false;
        let finalTranscript = '';
        let interimTranscript = '';

        // Set initial language
        recognition.lang = sttElements.languageSelect.value;

        // Event listeners
        sttElements.languageSelect.addEventListener('change', function() {
            recognition.lang = this.value;
            if (isRecording) {
                // Restart recognition with new language
                recognition.stop();
                setTimeout(() => {
                    recognition.start();
                }, 100);
            }
        });

        sttElements.startButton.addEventListener('click', function() {
            if (!isRecording) {
                try {
                    recognition.start();
                    showRecordingState(true);
                } catch (error) {
                    console.error('Recognition start error:', error);
                    alert('Error starting speech recognition. Please try again.');
                }
            }
        });

        sttElements.stopButton.addEventListener('click', function() {
            if (isRecording) {
                recognition.stop();
                showRecordingState(false);
            }
        });

        sttElements.copyButton.addEventListener('click', function() {
            if (sttElements.transcript.value) {
                navigator.clipboard.writeText(sttElements.transcript.value)
                    .then(() => {
                        // Show success message
                        const originalText = this.innerHTML;
                        this.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
                        setTimeout(() => {
                            this.innerHTML = originalText;
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Copy failed:', err);
                        alert('Failed to copy text. Please try again.');
                    });
            }
        });

        sttElements.clearButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear the transcript?')) {
                sttElements.transcript.value = '';
                finalTranscript = '';
                interimTranscript = '';
                updateButtonStates();
            }
        });

        // Recognition events
        recognition.onstart = function() {
            isRecording = true;
            showRecordingState(true);
        };

        recognition.onend = function() {
            isRecording = false;
            showRecordingState(false);
        };

        recognition.onerror = function(event) {
            console.error('Recognition error:', event.error);
            isRecording = false;
            showRecordingState(false);

            let errorMessage = 'An error occurred with speech recognition.';

            // Provide more specific error messages
            if (event.error === 'no-speech') {
                errorMessage = 'No speech was detected. Please try again.';
            } else if (event.error === 'audio-capture') {
                errorMessage = 'No microphone was found. Ensure that a microphone is installed and configured correctly.';
            } else if (event.error === 'not-allowed') {
                errorMessage = 'Permission to use microphone was denied. Please allow microphone access and try again.';
            } else if (event.error === 'network') {
                errorMessage = 'Network error occurred. Please check your internet connection.';
            }

            alert(errorMessage);
        };

        recognition.onresult = function(event) {
            interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;

                if (result.isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            updateTranscript();
        };

        // Helper functions
        function showRecordingState(recording) {
            if (recording) {
                sttElements.startButton.disabled = true;
                sttElements.stopButton.disabled = false;
                sttElements.statusIndicator.classList.remove('d-none');
                sttElements.languageSelect.disabled = true;
                document.title = '🔴 Recording... - Speech to Text';
            } else {
                sttElements.startButton.disabled = false;
                sttElements.stopButton.disabled = true;
                sttElements.statusIndicator.classList.add('d-none');
                sttElements.languageSelect.disabled = false;
                document.title = 'Accessibility Assistant';
            }
        }

        function updateTranscript() {
            // Combine final and interim transcripts
            sttElements.transcript.value = finalTranscript + interimTranscript;

            // Auto-scroll to bottom
            sttElements.transcript.scrollTop = sttElements.transcript.scrollHeight;

            // Update button states
            updateButtonStates();
        }

        function updateButtonStates() {
            const hasText = sttElements.transcript.value.trim().length > 0;
            sttElements.copyButton.disabled = !hasText;
            sttElements.clearButton.disabled = !hasText;
        }
    }

    // ---- DYSLEXIC TEXT FORMATTER ----
    function initDyslexicText() {
        const dtElements = {
            inputText: document.getElementById('inputText'),
            fileUpload: document.getElementById('fileUpload'),
            fontFamily: document.getElementById('fontFamily'),
            fontSize: document.getElementById('fontSize'),
            fontSizeValue: document.getElementById('fontSizeValue'),
            letterSpacing: document.getElementById('letterSpacing'),
            letterSpacingValue: document.getElementById('letterSpacingValue'),
            textColor: document.getElementById('textColor'),
            textColorPreset: document.getElementById('textColorPreset'),
            backgroundColor: document.getElementById('backgroundColor'),
            backgroundColorPreset: document.getElementById('backgroundColorPreset'),
            lineHeight: document.getElementById('lineHeight'),
            lineHeightValue: document.getElementById('lineHeightValue'),
            textPreview: document.getElementById('textPreview'),
            applyFormattingBtn: document.getElementById('applyFormattingBtn'),
            copyFormattedBtn: document.getElementById('copyFormattedBtn'),
            readAloudBtn: document.getElementById('readAloudBtn')
        };

        // Exit if elements don't exist
        if (!dtElements.inputText) return;

        // Initialize
        updateDtValueDisplay();

        // Event listeners
        dtElements.fileUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = function(e) {
                dtElements.inputText.value = e.target.result;
            };

            reader.onerror = function() {
                alert('Error reading file');
            };

            if (file.type === 'text/plain') {
                reader.readAsText(file);
            } else {
                alert('Currently only text files (.txt) are supported.');
            }
        });

        dtElements.fontSize.addEventListener('input', updateDtValueDisplay);
        dtElements.letterSpacing.addEventListener('input', updateDtValueDisplay);
        dtElements.lineHeight.addEventListener('input', updateDtValueDisplay);

        dtElements.textColorPreset.addEventListener('change', function() {
            dtElements.textColor.value = this.value;
        });

        dtElements.backgroundColorPreset.addEventListener('change', function() {
            dtElements.backgroundColor.value = this.value;
        });

        dtElements.applyFormattingBtn.addEventListener('click', function() {
            const text = dtElements.inputText.value.trim();
            if (!text) {
                alert('Please enter some text to format');
                return;
            }

            applyFormatting(text);
        });

        dtElements.copyFormattedBtn.addEventListener('click', function() {
            if (dtElements.textPreview.textContent.trim() === 'Your formatted text will appear here.') {
                alert('Format text first before copying');
                return;
            }

            // We want to copy the text without formatting
            const textToCopy = dtElements.textPreview.textContent;

            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    // Show success
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Copy failed:', err);
                    alert('Failed to copy text');
                });
        });

        dtElements.readAloudBtn.addEventListener('click', function() {
            const text = dtElements.textPreview.textContent.trim();
            if (text === 'Your formatted text will appear here.') {
                alert('Format text first before reading aloud');
                return;
            }

            // If already speaking, stop
            if (synth.speaking) {
                synth.cancel();
                this.innerHTML = '<i class="fas fa-volume-up me-1"></i>Read Aloud';
                return;
            }

            // Create and configure utterance
            utterance = new SpeechSynthesisUtterance(text);

            // Set a good default voice
            const voices = synth.getVoices();
            const englishVoice = voices.find(voice => voice.lang.includes('en'));
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            // Start speaking
            utterance.onstart = function() {
                dtElements.readAloudBtn.innerHTML = '<i class="fas fa-stop me-1"></i>Stop Reading';
            };

            utterance.onend = function() {
                dtElements.readAloudBtn.innerHTML = '<i class="fas fa-volume-up me-1"></i>Read Aloud';
            };

            synth.speak(utterance);
        });

        // Helper functions
        function updateDtValueDisplay() {
            dtElements.fontSizeValue.textContent = dtElements.fontSize.value;
            dtElements.letterSpacingValue.textContent = dtElements.letterSpacing.value;
            dtElements.lineHeightValue.textContent = dtElements.lineHeight.value;
        }

        function applyFormatting(text) {
            // Clear current content
            dtElements.textPreview.innerHTML = '';

            // Split text into paragraphs
            const paragraphs = text.split(/\n+/);

            // Create text nodes for each paragraph
            paragraphs.forEach(paragraph => {
                if (paragraph.trim()) {
                    const p = document.createElement('p');
                    p.textContent = paragraph;
                    dtElements.textPreview.appendChild(p);
                }
            });

            // Apply styles
            dtElements.textPreview.style.fontFamily = dtElements.fontFamily.value;
            dtElements.textPreview.style.fontSize = `${dtElements.fontSize.value}px`;
            dtElements.textPreview.style.letterSpacing = `${dtElements.letterSpacing.value}px`;
            dtElements.textPreview.style.color = dtElements.textColor.value;
            dtElements.textPreview.style.backgroundColor = dtElements.backgroundColor.value;
            dtElements.textPreview.style.lineHeight = dtElements.lineHeight.value;

            // Make sure text is visible (check contrast)
            const textColorRGB = hexToRgb(dtElements.textColor.value);
            const bgColorRGB = hexToRgb(dtElements.backgroundColor.value);

            if (textColorRGB && bgColorRGB) {
                const contrast = calculateContrast(textColorRGB, bgColorRGB);

                if (contrast < 4.5) {
                    const contrastWarning = document.createElement('div');
                    contrastWarning.className = 'alert alert-warning mt-3';
                    contrastWarning.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Warning: The current text and background colors may have insufficient contrast for easy reading. Consider choosing colors with higher contrast.';
                    dtElements.textPreview.appendChild(contrastWarning);
                }
            }

            // Announce to screen reader
            announceToScreenReader('Text formatting applied');
        }

        // Color and contrast utility functions
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        function calculateContrast(rgb1, rgb2) {
            // Calculate relative luminance
            const luminance1 = calculateLuminance(rgb1);
            const luminance2 = calculateLuminance(rgb2);

            // Calculate contrast ratio
            const brightest = Math.max(luminance1, luminance2);
            const darkest = Math.min(luminance1, luminance2);

            return (brightest + 0.05) / (darkest + 0.05);
        }

        function calculateLuminance(rgb) {
            const a = [rgb.r, rgb.g, rgb.b].map(function(v) {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }
    }

    // ---- IMAGE DESCRIPTION ----
    function initImageDescription() {
        const idElements = {
            uploadContainer: document.getElementById('uploadContainer'),
            resultContainer: document.getElementById('resultContainer'),
            dropZone: document.getElementById('dropZone'),
            imageUpload: document.getElementById('imageUpload'),
            browseButton: document.getElementById('browseButton'),
            imagePreview: document.getElementById('imagePreview'),
            loadingDescription: document.getElementById('loadingDescription'),
            descriptionText: document.getElementById('descriptionText'),
            readDescriptionBtn: document.getElementById('readDescriptionBtn'),
            copyDescriptionBtn: document.getElementById('copyDescriptionBtn'),
            uploadNewBtn: document.getElementById('uploadNewBtn')
        };

        // Exit if elements don't exist
        if (!idElements.uploadContainer) return;

        // Event listeners
        idElements.browseButton.addEventListener('click', function() {
            idElements.imageUpload.click();
        });

        idElements.imageUpload.addEventListener('change', function(e) {
            handleFileUpload(e.target.files[0]);
        });

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            idElements.dropZone.addEventListener(eventName, function(e) {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            idElements.dropZone.addEventListener(eventName, function() {
                this.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            idElements.dropZone.addEventListener(eventName, function() {
                this.classList.remove('drag-over');
            }, false);
        });

        idElements.dropZone.addEventListener('drop', function(e) {
            const file = e.dataTransfer.files[0];
            handleFileUpload(file);
        });

        idElements.uploadNewBtn.addEventListener('click', resetIdUI);

        idElements.readDescriptionBtn.addEventListener('click', function() {
            const text = idElements.descriptionText.textContent.trim();
            if (!text) return;

            // If already speaking, stop
            if (synth.speaking) {
                synth.cancel();
                this.innerHTML = '<i class="fas fa-volume-up me-2"></i>Read Description';
                return;
            }

            // Create and configure utterance
            utterance = new SpeechSynthesisUtterance(text);

            // Set a good default voice
            const voices = synth.getVoices();
            const englishVoice = voices.find(voice => voice.lang.includes('en'));
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            // Start speaking
            utterance.onstart = function() {
                idElements.readDescriptionBtn.innerHTML = '<i class="fas fa-stop me-2"></i>Stop Reading';
            };

            utterance.onend = function() {
                idElements.readDescriptionBtn.innerHTML = '<i class="fas fa-volume-up me-2"></i>Read Description';
            };

            synth.speak(utterance);
        });

        idElements.copyDescriptionBtn.addEventListener('click', function() {
            const text = idElements.descriptionText.textContent.trim();
            if (!text) return;

            navigator.clipboard.writeText(text)
                .then(() => {
                    // Show success
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check me-2"></i>Copied!';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Copy failed:', err);
                    alert('Failed to copy description');
                });
        });

        // Handler for file upload
        function handleFileUpload(file) {
            if (!file) return;

            // Check if file is an image
            if (!file.type.match('image.*')) {
                alert('Please upload an image file (jpg, png, etc.)');
                return;
            }

            // Display image preview
            const reader = new FileReader();
            reader.onload = function(e) {
                idElements.imagePreview.src = e.target.result;
                idElements.uploadContainer.classList.add('d-none');
                idElements.resultContainer.classList.remove('d-none');

                // Show loading state
                idElements.loadingDescription.classList.remove('d-none');
                idElements.descriptionText.textContent = '';

                // Announce to screen reader
                announceToScreenReader('Image uploaded. Analyzing...');

                // Send image to backend for AI analysis
                uploadImage(file);
            };
            reader.readAsDataURL(file);
        }

        // Upload image to server
        function uploadImage(file) {
            const formData = new FormData();
            formData.append('image', file);

            fetch('/api/analyze-image', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Server error: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                // Hide loading state
                idElements.loadingDescription.classList.add('d-none');

                if (data.success) {
                    // Display description
                    idElements.descriptionText.textContent = data.description;

                    // Announce to screen reader
                    announceToScreenReader('Image analysis complete. Description available.');

                    // Automatically read the description aloud if screen reader is enabled
                    setTimeout(() => {
                        const preferences = JSON.parse(localStorage.getItem('accessibilityPreferences') || '{}');
                        if (preferences.screenReader) {
                            idElements.readDescriptionBtn.click();
                        }
                    }, 500);
                } else {
                    throw new Error(data.error || 'Unknown error occurred');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                idElements.loadingDescription.classList.add('d-none');
                idElements.descriptionText.innerHTML = `<div class="alert alert-danger">Error analyzing image: ${error.message}</div>`;
            });
        }

        // Reset UI to initial state
        function resetIdUI() {
            idElements.uploadContainer.classList.remove('d-none');
            idElements.resultContainer.classList.add('d-none');
            idElements.imageUpload.value = '';
            idElements.descriptionText.textContent = '';

            // If speaking, stop
            if (synth.speaking) {
                synth.cancel();
            }
        }
    }

    // ---- CLEANUP ----
    window.addEventListener('beforeunload', function() {
        if (synth.speaking) {
            synth.cancel();
        }
    });
});
