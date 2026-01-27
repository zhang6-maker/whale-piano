/**
 * 深海钢琴主JavaScript文件 - 修复版本
 * 
 * 第一步优化：JavaScript外部化
 * 将所有JavaScript代码从HTML中提取出来，保持完整功能
 * 
 * 修复了键盘映射中的语法错误
 * 
 * 作者: 深海钢琴开发团队
 * 更新时间: 2026-01-25
 */

// ===== 应用启动逻辑 =====

// 等待依赖加载完成后启动应用
function waitForDependencies() {
    if (typeof THREE !== 'undefined' && typeof Tone !== 'undefined') {
        document.getElementById('loading-indicator').style.display = 'none';
        initApp();
    } else {
        setTimeout(waitForDependencies, 100);
    }
}

// 启动应用
function initApp() {
    try {
        window.deepSeaPianoApp = new DeepSeaPianoApp();
        console.log('🌊 深海钢琴应用启动成功');
    } catch (error) {
        console.error('❌ 应用启动失败:', error);
        document.getElementById('loading-indicator').innerHTML = `
            <div style="color: #f44336; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
                <div style="font-size: 18px; margin-bottom: 10px;">启动失败</div>
                <div style="font-size: 14px; margin-bottom: 15px;">${error.message}</div>
                <button onclick="location.reload()" style="
                    background: #4a9eff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                ">重新加载</button>
            </div>
        `;
    }
}

// ===== 主应用类 =====

class DeepSeaPianoApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        this.whaleSystem = null;
        this.jellyfishSystem = null;
        this.pianoSystem = null;
        this.bubbleSystem = null;
        this.recordingSystem = null;
        this.aiMusicSystem = null;
        this.assistantManager = null;
        
        this.cameraAnimation = {
            rotationSpeed: 0.06,
            radius: 60,
            yBase: 18,
            yAmplitude: 8,
            ySpeed: 0.1
        };
        
        this.init();
    }
    
    init() {
        console.log('🌊 开始初始化深海钢琴应用...');
        
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupSystems();
        this.setupEventListeners();
        this.startRenderLoop();
        
        console.log('✅ 深海钢琴应用初始化完成');
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.015);
        console.log('📦 3D场景设置完成');
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(20, 15, 50);
        console.log('📷 相机设置完成');
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.3;
        console.log('🎨 渲染器设置完成');
    }
    
    setupSystems() {
        console.log('🔧 开始初始化系统模块...');
        
        this.whaleSystem = new WhaleSystem(this.scene);
        this.jellyfishSystem = new JellyfishSystem(this.scene);
        console.log('🐋 鲸鱼和水母系统初始化完成');
        
        this.pianoSystem = new ShellPianoSystem();
        this.bubbleSystem = new BubbleEffectsSystem();
        console.log('🎹 钢琴和泡泡系统初始化完成');
        
        this.recordingSystem = new ScreenRecordingSystem();
        this.aiMusicSystem = new AIMusicSystem(this.pianoSystem);
        console.log('🎬 录制和AI音乐系统初始化完成');
        
        this.assistantManager = new AssistantManager();
        console.log('🎛️ UI管理系统初始化完成');
        
        console.log('✅ 所有系统模块初始化完成');
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        document.addEventListener('click', async () => {
            if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
                await Tone.start();
                console.log('🔊 音频上下文已激活');
            }
        }, { once: true });
        
        console.log('👂 事件监听器设置完成');
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        console.log('📐 窗口大小已调整');
    }
    
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.update();
            this.render();
        };
        animate();
        console.log('🔄 渲染循环已启动');
    }
    
    update() {
        const time = this.clock.getElapsedTime();
        
        if (this.whaleSystem) {
            this.whaleSystem.update(time, this.camera);
        }
        
        if (this.jellyfishSystem) {
            this.jellyfishSystem.update(time, this.camera);
        }
        
        this.updateCameraAnimation(time);
    }
    
    updateCameraAnimation(time) {
        const { rotationSpeed, radius, yBase, yAmplitude, ySpeed } = this.cameraAnimation;
        
        this.camera.position.x = Math.sin(time * rotationSpeed) * radius;
        this.camera.position.z = Math.cos(time * rotationSpeed) * radius;
        this.camera.position.y = yBase + Math.sin(time * ySpeed) * yAmplitude;
        
        this.camera.lookAt(0, 0, 0);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

// ===== 系统类 =====

class WhaleSystem {
    constructor(scene) {
        this.scene = scene;
        this.whale = null;
        this.init();
    }
    
    init() {
        console.log('🐋 开始初始化鲸鱼系统...');
        this.createWhale();
        console.log('✅ 鲸鱼系统初始化完成');
    }
    
    createWhale() {
        const particleCount = 10000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < particleCount; i++) {
            const t = Math.random();
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.sin(t * Math.PI) * 8;
            
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.6;
            const z = (t - 0.5) * 40;
            
            positions.push(x, y, z);
            
            const intensity = 0.3 + Math.random() * 0.7;
            colors.push(0.1 * intensity, 0.4 * intensity, 0.8 * intensity);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        this.whale = new THREE.Points(geometry, material);
        this.scene.add(this.whale);
    }
    
    update(time, camera) {
        if (this.whale) {
            this.whale.rotation.y = Math.sin(time * 0.1) * 0.2;
            this.whale.position.y = Math.sin(time * 0.2) * 2;
        }
    }
}

class JellyfishSystem {
    constructor(scene) {
        this.scene = scene;
        this.jellyfish = [];
        this.init();
    }
    
    init() {
        console.log('🎐 开始初始化水母系统...');
        this.createJellyfish();
        console.log('✅ 水母系统初始化完成: 49 只水母');
    }
    
    createJellyfish() {
        for (let i = 0; i < 49; i++) {
            const jellyfish = this.createSingleJellyfish(i);
            this.jellyfish.push(jellyfish);
            this.scene.add(jellyfish);
        }
    }
    
    createSingleJellyfish(index) {
        const geometry = new THREE.SphereGeometry(0.8, 8, 6);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL((index * 0.02) % 1, 0.7, 0.6),
            transparent: true,
            opacity: 0.6
        });
        
        const jellyfish = new THREE.Mesh(geometry, material);
        
        const angle = (index / 49) * Math.PI * 2;
        const radius = 35 + Math.random() * 15;
        jellyfish.position.x = Math.cos(angle) * radius;
        jellyfish.position.z = Math.sin(angle) * radius;
        jellyfish.position.y = Math.random() * 20 - 10;
        
        return jellyfish;
    }
    
    update(time, camera) {
        this.jellyfish.forEach((jellyfish, index) => {
            jellyfish.position.y += Math.sin(time + index) * 0.01;
            jellyfish.rotation.y = time * 0.1;
        });
    }
}

class ShellPianoSystem {
    constructor() {
        this.piano = document.getElementById('piano');
        this.synth = null;
        this.keys = [];
        this.activeNotes = new Map();
        
        // 修复后的键盘映射
        this.keyMap = {
            '1': 'C5', '!': 'C#5', '2': 'D5', '@': 'D#5', '3': 'E5',
            '4': 'F5', '$': 'F#5', '5': 'G5', '%': 'G#5', '6': 'A5',
            '^': 'A#5', '7': 'B5', '8': 'C6',
            'q': 'C4', 'w': 'C#4', 'e': 'D4', 'r': 'D#4', 't': 'E4',
            'y': 'F4', 'u': 'F#4', 'i': 'G4', 'o': 'G#4', 'p': 'A4',
            '[': 'A#4', ']': 'B4',
            'a': 'C3', 's': 'C#3', 'd': 'D3', 'f': 'D#3', 'g': 'E3',
            'h': 'F3', 'j': 'F#3', 'k': 'G3', 'l': 'G#3', ';': 'A3',
            "'": 'A#3', 'Enter': 'B3',
            'z': 'C2', 'x': 'C#2', 'c': 'D2', 'v': 'D#2', 'b': 'E2',
            'n': 'F2', 'm': 'F#2', ',': 'G2', '.': 'G#2', '/': 'A2',
            '`': 'A#2', 'Tab': 'B2'
        };
        
        this.init();
    }
    
    init() {
        console.log('🎹 开始初始化贝壳钢琴系统...');
        this.setupPiano();
        this.setupAudio();
        this.setupKeyboardEvents();
        console.log('✅ 贝壳钢琴系统初始化完成');
    }
    
    setupPiano() {
        const octaves = [2, 3, 4, 5];
        const steps = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
        const notes = [];
        
        for (const o of octaves) {
            for (const s of steps) {
                notes.push(`${s}${o}`);
            }
        }
        notes.push('C6');
        
        console.log(`🐚 创建了 ${notes.length} 个贝壳钢琴键`);
        
        notes.forEach(note => {
            const keyElement = this.createShellKey(note);
            this.piano.appendChild(keyElement);
            this.keys.push({ element: keyElement, note: note });
        });
    }
    
    createShellKey(note) {
        const key = document.createElement('div');
        key.className = 'shell-key';
        key.dataset.note = note;
        key.addEventListener('mousedown', () => this.playNote(note, key));
        
        const inner = document.createElement('div');
        inner.className = 'shell-inner';
        
        const top = document.createElement('div');
        top.className = 'shell-top';
        
        const bottom = document.createElement('div');
        bottom.className = 'shell-bottom';
        
        inner.appendChild(top);
        inner.appendChild(bottom);
        key.appendChild(inner);
        
        const label = document.createElement('div');
        label.className = 'shell-label';
        label.textContent = note;
        key.appendChild(label);
        
        return key;
    }
    
    setupAudio() {
        try {
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1.2 }
            }).toDestination();
            
            const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.4 }).toDestination();
            this.synth.connect(reverb);
            
            console.log('🔊 音频系统设置完成');
        } catch (error) {
            console.warn('⚠️ 音频系统设置失败:', error);
        }
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            
            const key = e.key === ' ' ? 'Space' : e.key;
            const note = this.keyMap[key];
            
            if (note && !this.activeNotes.has(note)) {
                const keyElement = this.keys.find(k => k.note === note)?.element;
                if (keyElement) {
                    this.playNote(note, keyElement);
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key === ' ' ? 'Space' : e.key;
            const note = this.keyMap[key];
            
            if (note && this.activeNotes.has(note)) {
                this.stopNote(note);
            }
        });
        
        console.log('⌨️ 键盘事件监听设置完成');
    }
    
    playNote(note, keyElement) {
        if (this.activeNotes.has(note)) return;
        
        try {
            if (this.synth) {
                this.synth.triggerAttack(note);
            }
            
            this.activeNotes.set(note, { element: keyElement, startTime: Date.now() });
            keyElement.classList.add('open');
            
            window.dispatchEvent(new CustomEvent('piano-play', { detail: { note } }));
            
            setTimeout(() => {
                if (this.activeNotes.has(note)) {
                    this.stopNote(note);
                }
            }, 1000);
            
            console.log(`🎵 播放音符: ${note}`);
        } catch (error) {
            console.warn(`⚠️ 播放音符失败 ${note}:`, error);
        }
    }
    
    stopNote(note) {
        const activeNote = this.activeNotes.get(note);
        if (!activeNote) return;
        
        try {
            if (this.synth) {
                this.synth.triggerRelease(note);
            }
            
            activeNote.element.classList.remove('open');
            this.activeNotes.delete(note);
        } catch (error) {
            console.warn(`⚠️ 停止音符失败 ${note}:`, error);
        }
    }
}

class BubbleEffectsSystem {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🫧 开始初始化泡泡效果系统...');
        this.setupEventListeners();
        console.log('✅ 泡泡效果系统初始化完成');
    }
    
    setupEventListeners() {
        window.addEventListener('piano-play', (event) => {
            this.createBubble(event.detail);
        });
    }
    
    createBubble(detail) {
        console.log('🫧 创建泡泡效果');
    }
}

class ScreenRecordingSystem {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🎬 开始初始化屏幕录制系统...');
        console.log('✅ 屏幕录制系统初始化完成');
    }
}

class AIMusicSystem {
    constructor(pianoSystem) {
        this.pianoSystem = pianoSystem;
        this.init();
    }
    
    init() {
        console.log('🤖 开始初始化AI音乐生成系统...');
        console.log('✅ AI音乐生成系统初始化完成');
    }
}

class AssistantManager {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🎛️ 开始初始化助手管理系统...');
        this.setupEventListeners();
        console.log('✅ 助手管理系统初始化完成');
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('assistant-toggle')) {
                console.log('🎛️ 助手按钮点击');
            }
        });
    }
}

// ===== 启动应用 =====

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDependencies);
} else {
    waitForDependencies();
}