/**
 * Internationalization (i18n) System
 * Supports multiple languages with system language detection
 */

export type TranslationKey =
    | 'voiceMessage'
    | 'videoMessage'
    | 'recordVoiceMessage'
    | 'recordVideoMessage'
    | 'startRecording'
    | 'stopAndSend'
    | 'pause'
    | 'resume'
    | 'cancel'
    | 'readyToRecord'
    | 'recording'
    | 'paused'
    | 'recordingCompleted'
    | 'microphonePermissionDenied'
    | 'cameraPermissionDenied'
    | 'failedToStartRecording'
    | 'failedToUpload'
    | 'play'
    | 'mute'
    | 'unmute'
    | 'playbackSpeed'
    | 'settings'
    | 'maxDuration'
    | 'maxFileSize'
    | 'audioFormat'
    | 'videoFormat'
    | 'bitrate'
    | 'allowedFormats'
    | 'enableWaveform';

export type Translations = Record<TranslationKey, string>;

export const translations: Record<string, Translations> = {
    en: {
        voiceMessage: 'Voice Message',
        videoMessage: 'Video Message',
        recordVoiceMessage: 'Record Voice Message',
        recordVideoMessage: 'Record Video Message',
        startRecording: 'Start Recording',
        stopAndSend: 'Stop & Send',
        pause: 'Pause',
        resume: 'Resume',
        cancel: 'Cancel',
        readyToRecord: 'Ready to record',
        recording: 'Recording...',
        paused: 'Paused',
        recordingCompleted: 'Recording completed',
        microphonePermissionDenied: 'Microphone permission denied. Please allow microphone access to record voice messages.',
        cameraPermissionDenied: 'Camera/microphone permission denied. Please allow access to record video messages.',
        failedToStartRecording: 'Failed to start recording. Please try again.',
        failedToUpload: 'Failed to upload. Please try again.',
        play: 'Play',
        mute: 'Mute',
        unmute: 'Unmute',
        playbackSpeed: 'Playback speed',
        settings: 'Settings',
        maxDuration: 'Maximum duration',
        maxFileSize: 'Maximum file size',
        audioFormat: 'Audio format',
        videoFormat: 'Video format',
        bitrate: 'Bitrate',
        allowedFormats: 'Allowed formats',
        enableWaveform: 'Enable waveform',
    },
    ru: {
        voiceMessage: 'Голосовое сообщение',
        videoMessage: 'Видеосообщение',
        recordVoiceMessage: 'Записать голосовое сообщение',
        recordVideoMessage: 'Записать видеосообщение',
        startRecording: 'Начать запись',
        stopAndSend: 'Остановить и отправить',
        pause: 'Пауза',
        resume: 'Продолжить',
        cancel: 'Отмена',
        readyToRecord: 'Готово к записи',
        recording: 'Запись...',
        paused: 'Пауза',
        recordingCompleted: 'Запись завершена',
        microphonePermissionDenied: 'Доступ к микрофону запрещён. Разрешите доступ к микрофону для записи голосовых сообщений.',
        cameraPermissionDenied: 'Доступ к камере/микрофону запрещён. Разрешите доступ для записи видеосообщений.',
        failedToStartRecording: 'Не удалось начать запись. Попробуйте снова.',
        failedToUpload: 'Не удалось загрузить. Попробуйте снова.',
        play: 'Воспроизвести',
        mute: 'Выключить звук',
        unmute: 'Включить звук',
        playbackSpeed: 'Скорость воспроизведения',
        settings: 'Настройки',
        maxDuration: 'Максимальная длительность',
        maxFileSize: 'Максимальный размер файла',
        audioFormat: 'Формат аудио',
        videoFormat: 'Формат видео',
        bitrate: 'Битрейт',
        allowedFormats: 'Разрешённые форматы',
        enableWaveform: 'Включить визуализацию',
    },
    de: {
        voiceMessage: 'Sprachnachricht',
        videoMessage: 'Videonachricht',
        recordVoiceMessage: 'Sprachnachricht aufnehmen',
        recordVideoMessage: 'Videonachricht aufnehmen',
        startRecording: 'Aufnahme starten',
        stopAndSend: 'Stoppen & Senden',
        pause: 'Pause',
        resume: 'Fortsetzen',
        cancel: 'Abbrechen',
        readyToRecord: 'Aufnahmebereit',
        recording: 'Aufnahme...',
        paused: 'Pausiert',
        recordingCompleted: 'Aufnahme abgeschlossen',
        microphonePermissionDenied: 'Mikrofonzugriff verweigert. Bitte erlauben Sie den Mikrofonzugriff.',
        cameraPermissionDenied: 'Kamera-/Mikrofonzugriff verweigert. Bitte erlauben Sie den Zugriff.',
        failedToStartRecording: 'Aufnahme konnte nicht gestartet werden. Bitte erneut versuchen.',
        failedToUpload: 'Upload fehlgeschlagen. Bitte erneut versuchen.',
        play: 'Abspielen',
        mute: 'Stummschalten',
        unmute: 'Ton einschalten',
        playbackSpeed: 'Wiedergabegeschwindigkeit',
        settings: 'Einstellungen',
        maxDuration: 'Maximale Dauer',
        maxFileSize: 'Maximale Dateigröße',
        audioFormat: 'Audioformat',
        videoFormat: 'Videoformat',
        bitrate: 'Bitrate',
        allowedFormats: 'Erlaubte Formate',
        enableWaveform: 'Wellenform aktivieren',
    },
    fr: {
        voiceMessage: 'Message vocal',
        videoMessage: 'Message vidéo',
        recordVoiceMessage: 'Enregistrer un message vocal',
        recordVideoMessage: 'Enregistrer un message vidéo',
        startRecording: 'Démarrer l\'enregistrement',
        stopAndSend: 'Arrêter et envoyer',
        pause: 'Pause',
        resume: 'Reprendre',
        cancel: 'Annuler',
        readyToRecord: 'Prêt à enregistrer',
        recording: 'Enregistrement...',
        paused: 'En pause',
        recordingCompleted: 'Enregistrement terminé',
        microphonePermissionDenied: 'Accès au microphone refusé. Veuillez autoriser l\'accès au microphone.',
        cameraPermissionDenied: 'Accès caméra/micro refusé. Veuillez autoriser l\'accès.',
        failedToStartRecording: 'Échec du démarrage de l\'enregistrement. Veuillez réessayer.',
        failedToUpload: 'Échec du téléchargement. Veuillez réessayer.',
        play: 'Lecture',
        mute: 'Couper le son',
        unmute: 'Activer le son',
        playbackSpeed: 'Vitesse de lecture',
        settings: 'Paramètres',
        maxDuration: 'Durée maximale',
        maxFileSize: 'Taille maximale du fichier',
        audioFormat: 'Format audio',
        videoFormat: 'Format vidéo',
        bitrate: 'Débit',
        allowedFormats: 'Formats autorisés',
        enableWaveform: 'Activer la forme d\'onde',
    },
    es: {
        voiceMessage: 'Mensaje de voz',
        videoMessage: 'Mensaje de video',
        recordVoiceMessage: 'Grabar mensaje de voz',
        recordVideoMessage: 'Grabar mensaje de video',
        startRecording: 'Iniciar grabación',
        stopAndSend: 'Detener y enviar',
        pause: 'Pausar',
        resume: 'Reanudar',
        cancel: 'Cancelar',
        readyToRecord: 'Listo para grabar',
        recording: 'Grabando...',
        paused: 'Pausado',
        recordingCompleted: 'Grabación completada',
        microphonePermissionDenied: 'Permiso de micrófono denegado. Por favor, permita el acceso al micrófono.',
        cameraPermissionDenied: 'Permiso de cámara/micrófono denegado. Por favor, permita el acceso.',
        failedToStartRecording: 'Error al iniciar la grabación. Por favor, intente de nuevo.',
        failedToUpload: 'Error al subir. Por favor, intente de nuevo.',
        play: 'Reproducir',
        mute: 'Silenciar',
        unmute: 'Activar sonido',
        playbackSpeed: 'Velocidad de reproducción',
        settings: 'Configuración',
        maxDuration: 'Duración máxima',
        maxFileSize: 'Tamaño máximo de archivo',
        audioFormat: 'Formato de audio',
        videoFormat: 'Formato de video',
        bitrate: 'Tasa de bits',
        allowedFormats: 'Formatos permitidos',
        enableWaveform: 'Habilitar forma de onda',
    },
    pt: {
        voiceMessage: 'Mensagem de voz',
        videoMessage: 'Mensagem de vídeo',
        recordVoiceMessage: 'Gravar mensagem de voz',
        recordVideoMessage: 'Gravar mensagem de vídeo',
        startRecording: 'Iniciar gravação',
        stopAndSend: 'Parar e enviar',
        pause: 'Pausar',
        resume: 'Retomar',
        cancel: 'Cancelar',
        readyToRecord: 'Pronto para gravar',
        recording: 'Gravando...',
        paused: 'Pausado',
        recordingCompleted: 'Gravação concluída',
        microphonePermissionDenied: 'Permissão do microfone negada. Por favor, permita o acesso ao microfone.',
        cameraPermissionDenied: 'Permissão da câmera/microfone negada. Por favor, permita o acesso.',
        failedToStartRecording: 'Falha ao iniciar a gravação. Por favor, tente novamente.',
        failedToUpload: 'Falha no upload. Por favor, tente novamente.',
        play: 'Reproduzir',
        mute: 'Silenciar',
        unmute: 'Ativar som',
        playbackSpeed: 'Velocidade de reprodução',
        settings: 'Configurações',
        maxDuration: 'Duração máxima',
        maxFileSize: 'Tamanho máximo do arquivo',
        audioFormat: 'Formato de áudio',
        videoFormat: 'Formato de vídeo',
        bitrate: 'Taxa de bits',
        allowedFormats: 'Formatos permitidos',
        enableWaveform: 'Ativar forma de onda',
    },
    zh: {
        voiceMessage: '语音消息',
        videoMessage: '视频消息',
        recordVoiceMessage: '录制语音消息',
        recordVideoMessage: '录制视频消息',
        startRecording: '开始录制',
        stopAndSend: '停止并发送',
        pause: '暂停',
        resume: '继续',
        cancel: '取消',
        readyToRecord: '准备录制',
        recording: '录制中...',
        paused: '已暂停',
        recordingCompleted: '录制完成',
        microphonePermissionDenied: '麦克风权限被拒绝。请允许麦克风访问以录制语音消息。',
        cameraPermissionDenied: '摄像头/麦克风权限被拒绝。请允许访问以录制视频消息。',
        failedToStartRecording: '无法开始录制。请重试。',
        failedToUpload: '上传失败。请重试。',
        play: '播放',
        mute: '静音',
        unmute: '取消静音',
        playbackSpeed: '播放速度',
        settings: '设置',
        maxDuration: '最大时长',
        maxFileSize: '最大文件大小',
        audioFormat: '音频格式',
        videoFormat: '视频格式',
        bitrate: '比特率',
        allowedFormats: '允许的格式',
        enableWaveform: '启用波形',
    },
    ja: {
        voiceMessage: '音声メッセージ',
        videoMessage: 'ビデオメッセージ',
        recordVoiceMessage: '音声メッセージを録音',
        recordVideoMessage: 'ビデオメッセージを録画',
        startRecording: '録音開始',
        stopAndSend: '停止して送信',
        pause: '一時停止',
        resume: '再開',
        cancel: 'キャンセル',
        readyToRecord: '録音準備完了',
        recording: '録音中...',
        paused: '一時停止中',
        recordingCompleted: '録音完了',
        microphonePermissionDenied: 'マイクのアクセスが拒否されました。マイクへのアクセスを許可してください。',
        cameraPermissionDenied: 'カメラ/マイクのアクセスが拒否されました。アクセスを許可してください。',
        failedToStartRecording: '録音を開始できませんでした。もう一度お試しください。',
        failedToUpload: 'アップロードに失敗しました。もう一度お試しください。',
        play: '再生',
        mute: 'ミュート',
        unmute: 'ミュート解除',
        playbackSpeed: '再生速度',
        settings: '設定',
        maxDuration: '最大時間',
        maxFileSize: '最大ファイルサイズ',
        audioFormat: 'オーディオ形式',
        videoFormat: 'ビデオ形式',
        bitrate: 'ビットレート',
        allowedFormats: '許可された形式',
        enableWaveform: '波形を有効化',
    },
    ko: {
        voiceMessage: '음성 메시지',
        videoMessage: '영상 메시지',
        recordVoiceMessage: '음성 메시지 녹음',
        recordVideoMessage: '영상 메시지 녹화',
        startRecording: '녹음 시작',
        stopAndSend: '중지 및 전송',
        pause: '일시정지',
        resume: '재개',
        cancel: '취소',
        readyToRecord: '녹음 준비 완료',
        recording: '녹음 중...',
        paused: '일시정지됨',
        recordingCompleted: '녹음 완료',
        microphonePermissionDenied: '마이크 권한이 거부되었습니다. 음성 메시지를 녹음하려면 마이크 액세스를 허용하세요.',
        cameraPermissionDenied: '카메라/마이크 권한이 거부되었습니다. 액세스를 허용하세요.',
        failedToStartRecording: '녹음을 시작할 수 없습니다. 다시 시도하세요.',
        failedToUpload: '업로드에 실패했습니다. 다시 시도하세요.',
        play: '재생',
        mute: '음소거',
        unmute: '음소거 해제',
        playbackSpeed: '재생 속도',
        settings: '설정',
        maxDuration: '최대 길이',
        maxFileSize: '최대 파일 크기',
        audioFormat: '오디오 형식',
        videoFormat: '비디오 형식',
        bitrate: '비트레이트',
        allowedFormats: '허용된 형식',
        enableWaveform: '파형 활성화',
    },
    it: {
        voiceMessage: 'Messaggio vocale',
        videoMessage: 'Messaggio video',
        recordVoiceMessage: 'Registra messaggio vocale',
        recordVideoMessage: 'Registra messaggio video',
        startRecording: 'Avvia registrazione',
        stopAndSend: 'Ferma e invia',
        pause: 'Pausa',
        resume: 'Riprendi',
        cancel: 'Annulla',
        readyToRecord: 'Pronto per registrare',
        recording: 'Registrazione...',
        paused: 'In pausa',
        recordingCompleted: 'Registrazione completata',
        microphonePermissionDenied: 'Permesso microfono negato. Consenti l\'accesso al microfono.',
        cameraPermissionDenied: 'Permesso fotocamera/microfono negato. Consenti l\'accesso.',
        failedToStartRecording: 'Impossibile avviare la registrazione. Riprova.',
        failedToUpload: 'Caricamento fallito. Riprova.',
        play: 'Riproduci',
        mute: 'Disattiva audio',
        unmute: 'Attiva audio',
        playbackSpeed: 'Velocità di riproduzione',
        settings: 'Impostazioni',
        maxDuration: 'Durata massima',
        maxFileSize: 'Dimensione massima file',
        audioFormat: 'Formato audio',
        videoFormat: 'Formato video',
        bitrate: 'Bitrate',
        allowedFormats: 'Formati consentiti',
        enableWaveform: 'Abilita forma d\'onda',
    },
    nl: {
        voiceMessage: 'Spraakbericht',
        videoMessage: 'Videobericht',
        recordVoiceMessage: 'Spraakbericht opnemen',
        recordVideoMessage: 'Videobericht opnemen',
        startRecording: 'Opname starten',
        stopAndSend: 'Stoppen en verzenden',
        pause: 'Pauzeren',
        resume: 'Hervatten',
        cancel: 'Annuleren',
        readyToRecord: 'Klaar om op te nemen',
        recording: 'Opname...',
        paused: 'Gepauzeerd',
        recordingCompleted: 'Opname voltooid',
        microphonePermissionDenied: 'Microfoontoestemming geweigerd. Sta microfoongebruik toe.',
        cameraPermissionDenied: 'Camera-/microfoontoestemming geweigerd. Sta toegang toe.',
        failedToStartRecording: 'Kan opname niet starten. Probeer opnieuw.',
        failedToUpload: 'Upload mislukt. Probeer opnieuw.',
        play: 'Afspelen',
        mute: 'Dempen',
        unmute: 'Dempen opheffen',
        playbackSpeed: 'Afspeelsnelheid',
        settings: 'Instellingen',
        maxDuration: 'Maximale duur',
        maxFileSize: 'Maximale bestandsgrootte',
        audioFormat: 'Audioformaat',
        videoFormat: 'Videoformaat',
        bitrate: 'Bitrate',
        allowedFormats: 'Toegestane formaten',
        enableWaveform: 'Golfvorm inschakelen',
    },
    pl: {
        voiceMessage: 'Wiadomość głosowa',
        videoMessage: 'Wiadomość wideo',
        recordVoiceMessage: 'Nagraj wiadomość głosową',
        recordVideoMessage: 'Nagraj wiadomość wideo',
        startRecording: 'Rozpocznij nagrywanie',
        stopAndSend: 'Zatrzymaj i wyślij',
        pause: 'Pauza',
        resume: 'Wznów',
        cancel: 'Anuluj',
        readyToRecord: 'Gotowy do nagrywania',
        recording: 'Nagrywanie...',
        paused: 'Wstrzymano',
        recordingCompleted: 'Nagrywanie zakończone',
        microphonePermissionDenied: 'Odmowa dostępu do mikrofonu. Zezwól na dostęp do mikrofonu.',
        cameraPermissionDenied: 'Odmowa dostępu do kamery/mikrofonu. Zezwól na dostęp.',
        failedToStartRecording: 'Nie można rozpocząć nagrywania. Spróbuj ponownie.',
        failedToUpload: 'Przesyłanie nie powiodło się. Spróbuj ponownie.',
        play: 'Odtwórz',
        mute: 'Wycisz',
        unmute: 'Włącz dźwięk',
        playbackSpeed: 'Szybkość odtwarzania',
        settings: 'Ustawienia',
        maxDuration: 'Maksymalny czas',
        maxFileSize: 'Maksymalny rozmiar pliku',
        audioFormat: 'Format audio',
        videoFormat: 'Format wideo',
        bitrate: 'Bitrate',
        allowedFormats: 'Dozwolone formaty',
        enableWaveform: 'Włącz falę dźwiękową',
    },
};

// Current language
let currentLanguage = 'en';

/**
 * Detect system/browser language
 */
export function detectLanguage(): string {
    const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
    const langCode = browserLang.split('-')[0].toLowerCase();

    if (translations[langCode]) {
        return langCode;
    }

    return 'en';
}

/**
 * Initialize i18n with system language detection
 */
export function initI18n(): void {
    currentLanguage = detectLanguage();
}

/**
 * Set current language
 */
export function setLanguage(lang: string): void {
    if (translations[lang]) {
        currentLanguage = lang;
    }
}

/**
 * Get current language
 */
export function getLanguage(): string {
    return currentLanguage;
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): string[] {
    return Object.keys(translations);
}

/**
 * Translate a key to current language
 */
export function t(key: TranslationKey): string {
    const translation = translations[currentLanguage];
    if (translation && translation[key]) {
        return translation[key];
    }

    // Fallback to English
    return translations.en[key] || key;
}

// Initialize on load
initI18n();
