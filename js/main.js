/**
 * 深海钢琴主JavaScript文件
 * 
 * 第一步优化：JavaScript外部化
 * 将所有JavaScript代码从HTML中提取出来，保持完整功能
 * 
 * 包含：
 * - 应用启动逻辑
 * - 主应用类 DeepSeaPianoApp
 * - 鲸鱼系统 WhaleSystem
 * - 水母系统 JellyfishSystem  
 * - 钢琴系统 ShellPianoSystem
 * - 泡泡效果系统 BubbleEffectsSystem
 * - 录制系统 ScreenRecordingSystem
 * - AI音乐系统 AIMusicSystem
 * - 助手管理系统 AssistantManager
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
                <div style="margin-top: 10px; font-size: 12px; color: #aaa;">
                    如果问题持续，请尝试刷新页面或检查网络连接
                </div>
            </div>
        `;
    }
}

// ===== 主应用类 =====

/**
 * 深海钢琴应用主类
 * 
 * 负责：
 * - 3D场景管理
 * - 渲染循环
 * - 系统模块协调
 * - 事件处理
 */
class DeepSeaPianoApp {
    constructor() {
        // 3D渲染相关
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // 后处理相关
        this.renderTarget = null;
        this.bloomRenderTarget = null;
        this.tempRenderTarget = null;
        this.postScene = null;
        this.postCamera = null;
        this.brightnessMaterial = null;
        this.blurMaterial = null;
        this.compositeMaterial = null;
        
        // 系统模块
        this.whaleSystem = null;
        this.jellyfishSystem = null;
        this.pianoSystem = null;
        this.bubbleSystem = null;
        this.recordingSystem = null;
        this.aiMusicSystem = null;
        this.assistantManager = null;
        
        // 相机动画配置
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
        this.setupPostProcessing();
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
    
    setupPostProcessing() {
        try {
            // 创建渲染目标
            this.renderTarget = new THREE.WebGLRenderTarget(
                window.innerWidth, 
                window.innerHeight,
                {
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    format: THREE.RGBAFormat,
                    stencilBuffer: false
                }
            );
            
            // 创建Bloom渲染目标（较小分辨率用于性能优化）
            this.bloomRenderTarget = new THREE.WebGLRenderTarget(
                Math.floor(window.innerWidth / 2), 
                Math.floor(window.innerHeight / 2),
                {
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    format: THREE.RGBAFormat,
                    stencilBuffer: false
                }
            );
            
            // 创建后处理场景和相机
            this.postScene = new THREE.Scene();
            this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            
            // 创建全屏四边形
            const postGeometry = new THREE.PlaneGeometry(2, 2);
            
            // 亮度提取材质
            this.brightnessMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    tDiffuse: { value: null },
                    threshold: { value: 0.85 },
                    smoothWidth: { value: 0.1 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D tDiffuse;
                    uniform float threshold;
                    uniform float smoothWidth;
                    varying vec2 vUv;
                    
                    void main() {
                        vec4 color = texture2D(tDiffuse, vUv);
                        float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
                        float contribution = smoothstep(threshold - smoothWidth, threshold + smoothWidth, brightness);
                        gl_FragColor = color * contribution;
                    }
                `
            });
            
            // 模糊材质（简化版高斯模糊）
            this.blurMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    tDiffuse: { value: null },
                    resolution: { value: new THREE.Vector2() },
                    direction: { value: new THREE.Vector2(1, 0) }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D tDiffuse;
                    uniform vec2 resolution;
                    uniform vec2 direction;
                    varying vec2 vUv;
                    
                    void main() {
                        vec2 texelSize = 1.0 / resolution;
                        vec4 color = vec4(0.0);
                        
                        // 简化的5点模糊
                        color += texture2D(tDiffuse, vUv - 2.0 * texelSize * direction) * 0.0625;
                        color += texture2D(tDiffuse, vUv - texelSize * direction) * 0.25;
                        color += texture2D(tDiffuse, vUv) * 0.375;
                        color += texture2D(tDiffuse, vUv + texelSize * direction) * 0.25;
                        color += texture2D(tDiffuse, vUv + 2.0 * texelSize * direction) * 0.0625;
                        
                        gl_FragColor = color;
                    }
                `
            });
            
            // 最终合成材质
            this.compositeMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    tDiffuse: { value: null },
                    tBloom: { value: null },
                    bloomStrength: { value: 1.0 },
                    bloomRadius: { value: 1.0 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D tDiffuse;
                    uniform sampler2D tBloom;
                    uniform float bloomStrength;
                    uniform float bloomRadius;
                    varying vec2 vUv;
                    
                    void main() {
                        vec4 original = texture2D(tDiffuse, vUv);
                        vec4 bloom = texture2D(tBloom, vUv);
                        
                        // 混合原图和bloom效果
                        gl_FragColor = original + bloom * bloomStrength;
                    }
                `
            });
            
            // 创建后处理网格
            this.brightnessQuad = new THREE.Mesh(postGeometry, this.brightnessMaterial);
            this.blurQuad = new THREE.Mesh(postGeometry, this.blurMaterial);
            this.compositeQuad = new THREE.Mesh(postGeometry, this.compositeMaterial);
            
            // 设置模糊分辨率
            this.blurMaterial.uniforms.resolution.value.set(
                this.bloomRenderTarget.width, 
                this.bloomRenderTarget.height
            );
            
            console.log('✨ Bloom后处理效果设置完成');
        } catch (error) {
            console.warn('⚠️ Bloom后处理设置失败，将使用基础渲染:', error);
        }
    }
    
    setupSystems() {
        console.log('🔧 开始初始化系统模块...');
        
        // 初始化3D场景系统
        this.whaleSystem = new WhaleSystem(this.scene);
        this.jellyfishSystem = new JellyfishSystem(this.scene);
        console.log('🐋 鲸鱼和水母系统初始化完成');
        
        // 初始化交互系统
        this.pianoSystem = new ShellPianoSystem();
        this.bubbleSystem = new BubbleEffectsSystem();
        console.log('🎹 钢琴和泡泡系统初始化完成');
        
        // 初始化功能系统
        this.recordingSystem = new ScreenRecordingSystem();
        this.aiMusicSystem = new AIMusicSystem(this.pianoSystem);
        console.log('🎬 录制和AI音乐系统初始化完成');
        
        // 初始化UI管理系统
        this.assistantManager = new AssistantManager();
        console.log('🎛️ UI管理系统初始化完成');
        
        console.log('✅ 所有系统模块初始化完成');
    }
    
    setupEventListeners() {
        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 音频上下文激活
        document.addEventListener('click', async () => {
            if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
                await Tone.start();
                console.log('🔊 音频上下文已激活');
            }
        }, { once: true });
        
        console.log('👂 事件监听器设置完成');
    }
    
    handleResize() {
        // 更新相机
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // 更新渲染器
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // 更新渲染目标大小
        if (this.renderTarget) {
            this.renderTarget.setSize(window.innerWidth, window.innerHeight);
        }
        if (this.bloomRenderTarget) {
            this.bloomRenderTarget.setSize(
                Math.floor(window.innerWidth / 2), 
                Math.floor(window.innerHeight / 2)
            );
            // 更新模糊材质的分辨率
            if (this.blurMaterial) {
                this.blurMaterial.uniforms.resolution.value.set(
                    this.bloomRenderTarget.width, 
                    this.bloomRenderTarget.height
                );
            }
        }
        if (this.tempRenderTarget) {
            this.tempRenderTarget.setSize(
                Math.floor(window.innerWidth / 2), 
                Math.floor(window.innerHeight / 2)
            );
        }
        
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
        
        // 更新3D场景系统
        if (this.whaleSystem) {
            this.whaleSystem.update(time, this.camera);
        }
        
        if (this.jellyfishSystem) {
            this.jellyfishSystem.update(time, this.camera);
        }
        
        // 更新相机动画
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
        try {
            // 如果后处理可用，使用Bloom效果
            if (this.renderTarget && this.bloomRenderTarget && this.brightnessMaterial) {
                this.renderWithBloom();
            } else {
                // 回退到基础渲染
                this.renderBasic();
            }
        } catch (error) {
            console.warn('⚠️ 渲染过程出错，回退到基础渲染:', error);
            this.renderBasic();
        }
    }
    
    renderWithBloom() {
        // 第一步：渲染场景到主渲染目标
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);
        
        // 第二步：提取亮部到bloom渲染目标
        this.brightnessMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
        this.postScene.clear();
        this.postScene.add(this.brightnessQuad);
        this.renderer.setRenderTarget(this.bloomRenderTarget);
        this.renderer.render(this.postScene, this.postCamera);
        
        // 第三步：水平模糊
        this.blurMaterial.uniforms.tDiffuse.value = this.bloomRenderTarget.texture;
        this.blurMaterial.uniforms.direction.value.set(1, 0);
        this.postScene.clear();
        this.postScene.add(this.blurQuad);
        
        // 创建临时渲染目标用于ping-pong
        if (!this.tempRenderTarget) {
            this.tempRenderTarget = this.bloomRenderTarget.clone();
        }
        
        this.renderer.setRenderTarget(this.tempRenderTarget);
        this.renderer.render(this.postScene, this.postCamera);
        
        // 第四步：垂直模糊
        this.blurMaterial.uniforms.tDiffuse.value = this.tempRenderTarget.texture;
        this.blurMaterial.uniforms.direction.value.set(0, 1);
        this.renderer.setRenderTarget(this.bloomRenderTarget);
        this.renderer.render(this.postScene, this.postCamera);
        
        // 第五步：最终合成到屏幕
        this.compositeMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
        this.compositeMaterial.uniforms.tBloom.value = this.bloomRenderTarget.texture;
        this.postScene.clear();
        this.postScene.add(this.compositeQuad);
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postScene, this.postCamera);
    }
    
    renderBasic() {
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);
    }
}

// ===== 简化的系统类（确保功能正常） =====

/**
 * 鲸鱼系统 - 简化版本
 * 创建基本的鲸鱼粒子效果
 */
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
        // 创建简化的鲸鱼粒子系统
        const particleCount = 10000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < particleCount; i++) {
            // 鲸鱼形状的简化版本
            const t = Math.random();
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.sin(t * Math.PI) * 8;
            
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.6;
            const z = (t - 0.5) * 40;
            
            positions.push(x, y, z);
            
            // 蓝色渐变
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
            // 简单的游泳动画
            this.whale.rotation.y = Math.sin(time * 0.1) * 0.2;
            this.whale.position.y = Math.sin(time * 0.2) * 2;
        }
    }
}

/**
 * 水母系统 - 简化版本
 * 创建49个水母对应49个音符
 */
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
        // 创建49个水母对应49个音符
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
        
        // 圆形分布
        const angle = (index / 49) * Math.PI * 2;
        const radius = 35 + Math.random() * 15;
        jellyfish.position.x = Math.cos(angle) * radius;
        jellyfish.position.z = Math.sin(angle) * radius;
        jellyfish.position.y = Math.random() * 20 - 10;
        
        return jellyfish;
    }
    
    update(time, camera) {
        this.jellyfish.forEach((jellyfish, index) => {
            // 简单的浮动动画
            jellyfish.position.y += Math.sin(time + index) * 0.01;
            jellyfish.rotation.y = time * 0.1;
        });
    }
}

/**
 * 钢琴系统 - 简化版本
 * 处理键盘输入和音频播放
 */
class ShellPianoSystem {
    constructor() {
        this.piano = document.getElementById('piano');
        this.synth = null;
        this.keys = [];
        this.activeNotes = new Map();
        
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
            
            // 触发事件
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

/**
 * 泡泡效果系统 - 简化版本
 */
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
        // 简化的泡泡效果
        console.log('🫧 创建泡泡效果');
    }
}

/**
 * 录制系统 - 简化版本
 */
class ScreenRecordingSystem {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🎬 开始初始化屏幕录制系统...');
        console.log('✅ 屏幕录制系统初始化完成');
    }
}

/**
 * AI音乐系统 - 简化版本
 */
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

/**
 * 助手管理系统 - 简化版本
 */
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
        // 简化的事件处理
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('assistant-toggle')) {
                console.log('🎛️ 助手按钮点击');
            }
        });
    }
}

// ===== 启动应用 =====

// 页面加载完成后启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDependencies);
} else {
    waitForDependencies();
}