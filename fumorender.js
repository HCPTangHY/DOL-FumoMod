/**
 * FumoMod 渲染辅助
 * 使用DOL原生CanvasModel架构
 */

// 从DOL原版V变量构建渲染选项
window.FumoHelper = {
    // 根据DOL原版状态获取表情
    getExpression() {
        if (V.pain > 80 || V.trauma > 8000) return 'sad';
        if (V.arousal > 8000 && V.drunk > 400) return 'vampireSmile';
        if (V.stress < 3000 && V.tiredness < 3000) return 'calm';
        if (V.arousal > 6500) return 'badsmile';
        if (V.arousal > 4000) return 'curious';
        return 'smile';
    },

    // 从DOL原版V.worn获取衣服数据
    getClothes() {
        const clothes = [];
        const slots = ['upper', 'lower', 'under_upper', 'under_lower', 'head', 'face', 'neck', 'hands', 'feet', 'over_upper', 'over_lower', 'legs'];
        
        for (const slot of slots) {
            const worn = V.worn?.[slot];
            if (worn && worn.name !== 'naked') {
                const index = setup.clothes[slot]?.findIndex(c => c.name === worn.name);
                const setupObj = index >= 0 ? setup.clothes[slot][index] : null;
                const variable = setupObj?.variable || worn.name.replace(/ /g, '_').toLowerCase();
                
                clothes.push({
                    slot: slot,
                    item: variable,
                    colour: worn.colour,
                    accColour: worn.accessory_colour,
                    pattern: worn.pattern
                });
            }
        }
        return clothes;
    },

    // 构建完整的模型选项
    buildModelOptions() {
        return {
            skin_type: V.skinColor?.natural || 'light',
            skin_tone: V.tan?.level || 0,
            hair_colour: (V.haircolour || 'red').replace(/ /g, ''),
            hair_sides_type: V.hairtype || 'default',
            hair_fringe_type: V.fringetype || 'default',
            hair_fringe_colour: (V.hairfringecolour || '').replace(/ /g, ''),
            left_eye: V.eyecolour || 'purple',
            right_eye: V.eyecolour || 'purple',
            expression: this.getExpression(),
            clothes: this.getClothes(),
            basePath: 'fumoimg/',
            show_body: true,
            show_face: true,
            show_hair: true,
            show_clothes: true
        };
    },

    // 应用选项到_modeloptions
    applyToModelOptions(modeloptions) {
        const opts = this.buildModelOptions();
        Object.assign(modeloptions, opts);
    }
};

// 设置面板滑动条回调
window.fumoOffsetChange = function(val) {
    val = parseInt(val);
    State.variables.fumoOptions.offsetX = val;
    var span = document.getElementById('fumoOffsetVal');
    if (span) span.textContent = val;
    var fc = document.querySelector('#fumo-img .fumoCanvas');
    if (fc) fc.style.left = 'calc(99px + ' + val + 'px)';
};
