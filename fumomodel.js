/**
 * FumoMod 纸娃娃模型
 */

// 图片存在检测
function checkImageExists(src) {
    return modSC2DataManager.getHtmlTagSrcHook().checkImageExist(src);
}

// Z轴层级
const FumoZIndices = {
    backClothes: -20,
    backHair: -10,
    sidesBack: -9,      // 侧发后面部分（back.png）
    body: 0,
    head: 10,
    eyes: 20,
    iris: 25,
    expression: 30,
    underLower: 40,
    underUpper: 42,
    lower: 50,
    upper: 52,
    overLower: 60,
    overUpper: 62,
    feetSlot: 45,
    legsSlot: 48,
    sidesHair: 85,      // 侧发前面部分（在前发/刘海下面）
    frontHair: 90,      // 前发/刘海
    headwear: 100,
    faceSlot: 105
};

// 衣服槽位配置
const ClothingSlots = [
    { slot: "under_lower", category: "under_lower", z: FumoZIndices.underLower },
    { slot: "under_upper", category: "under_upper", z: FumoZIndices.underUpper },
    { slot: "lower", category: "lower", z: FumoZIndices.lower },
    { slot: "upper", category: "upper", z: FumoZIndices.upper },
    { slot: "over_lower", category: "over_lower", z: FumoZIndices.overLower },
    { slot: "over_upper", category: "over_upper", z: FumoZIndices.overUpper },
    { slot: "feet", category: "feet", z: FumoZIndices.feetSlot },
    { slot: "legs", category: "legs", z: FumoZIndices.legsSlot },
    { slot: "head", category: "head", z: FumoZIndices.headwear },
    { slot: "face", category: "face", z: FumoZIndices.faceSlot }
];

// 辅助函数：获取衣服数据
function getClothingData(options, slot) {
    if (!options.clothes) return null;
    return options.clothes.find(c => c && c.slot === slot);
}

// 辅助函数：查找衣服图片（支持 full.png 和 full_gray.png）
function findClothingImage(options, slot, category, suffix) {
    const clothe = getClothingData(options, slot);
    if (!clothe || !clothe.item) return null;
    
    // item 已经是 variable 格式（由 FumoHelper.getClothes 处理）
    const itemName = clothe.item;
    const basePath = `${options.basePath}clothes/${category}/${itemName}/`;
    
    // 先检查普通版本
    const normalPath = basePath + suffix + ".png";
    if (checkImageExists(normalPath)) {
        return { path: normalPath, isGray: false };
    }
    
    // 再检查灰度版本
    const grayPath = basePath + suffix + "_gray.png";
    if (checkImageExists(grayPath)) {
        return { path: grayPath, isGray: true };
    }
    
    return null;
}

// 辅助函数：查找 pattern 图片
function findPatternImage(options, slot, category) {
    const clothe = getClothingData(options, slot);
    if (!clothe || !clothe.item || !clothe.pattern) return null;
    
    const itemName = clothe.item;
    // pattern 名称需要处理空格
    let patternName = clothe.pattern;
    const basePath = `${options.basePath}clothes/${category}/${itemName}/pattern/${patternName}/`;
    
    // 先检查 acc.png
    const normalPath = basePath + "acc.png";
    if (checkImageExists(normalPath)) {
        return { path: normalPath, isGray: false };
    }
    
    // 再检查 acc_gray.png
    const grayPath = basePath + "acc_gray.png";
    if (checkImageExists(grayPath)) {
        return { path: grayPath, isGray: true };
    }
    
    // 也检查 full.png / full_gray.png
    const fullPath = basePath + "full.png";
    if (checkImageExists(fullPath)) {
        return { path: fullPath, isGray: false };
    }
    
    const fullGrayPath = basePath + "full_gray.png";
    if (checkImageExists(fullGrayPath)) {
        return { path: fullGrayPath, isGray: true };
    }
    
    return null;
}

// 创建衣服图层定义
function createClothingLayer(slotConfig, isAcc) {
    const suffix = isAcc ? "acc" : "full";
    return {
        z: slotConfig.z + (isAcc ? 0.5 : 0),
        animation: "idle",
        showfn(options) {
            if (!options.show_clothes) return false;
            const imgInfo = findClothingImage(options, slotConfig.slot, slotConfig.category, suffix);
            return imgInfo !== null;
        },
        srcfn(options) {
            const imgInfo = findClothingImage(options, slotConfig.slot, slotConfig.category, suffix);
            return imgInfo ? imgInfo.path : null;
        },
        filtersfn(options) {
            const imgInfo = findClothingImage(options, slotConfig.slot, slotConfig.category, suffix);
            // 只有灰度图才需要滤镜
            if (!imgInfo || !imgInfo.isGray) return [];
            
            const filterKey = isAcc ? `worn_${slotConfig.slot}_acc` : `worn_${slotConfig.slot}`;
            return [filterKey];
        },
        // 灰度图需要使用 multiply 混合模式
        blendfn(options) {
            const imgInfo = findClothingImage(options, slotConfig.slot, slotConfig.category, suffix);
            return (imgInfo && imgInfo.isGray) ? "multiply" : "source-over";
        }
    };
}

// 创建 pattern 图层定义
function createPatternLayer(slotConfig) {
    return {
        z: slotConfig.z + 0.7, // pattern 在 acc 之上
        animation: "idle",
        showfn(options) {
            if (!options.show_clothes) return false;
            const imgInfo = findPatternImage(options, slotConfig.slot, slotConfig.category);
            return imgInfo !== null;
        },
        srcfn(options) {
            const imgInfo = findPatternImage(options, slotConfig.slot, slotConfig.category);
            return imgInfo ? imgInfo.path : null;
        },
        filtersfn(options) {
            const imgInfo = findPatternImage(options, slotConfig.slot, slotConfig.category);
            // 只有灰度图才需要滤镜，pattern 通常使用 acc 颜色
            if (!imgInfo || !imgInfo.isGray) return [];
            return [`worn_${slotConfig.slot}_acc`];
        },
        blendfn(options) {
            const imgInfo = findPatternImage(options, slotConfig.slot, slotConfig.category);
            return (imgInfo && imgInfo.isGray) ? "multiply" : "source-over";
        }
    };
}

Renderer.CanvasModels.fumo = {
    name: "fumo",
    width: 256,
    height: 256,
    frames: 1,
    scale: true,

    defaultOptions() {
        return {
            show_body: true,
            show_face: true,
            show_hair: true,
            show_clothes: true,

            // 皮肤
            skin_type: "light",
            skin_tone: 0,
            
            // 头发
            hair_colour: "red",             // 头发颜色
            hair_sides_type: "default",     // 侧发类型
            hair_fringe_type: "default",    // 刘海类型
            hair_fringe_colour: "",         // 刘海颜色（空则使用 hair_colour）
            
            // 眼睛
            left_eye: "purple",
            right_eye: "purple",
            
            // 表情
            expression: "smile",

            // 衣服列表 [{slot, item, colour, accColour}]
            clothes: [],

            filters: {},
            basePath: "fumoimg/"
        };
    },

    /**
     * 预处理 - 设置滤镜
     */
    preprocess(options) {
        // 皮肤滤镜
        options.filters.skin = setup.colours.getSkinFilter(options.skin_type, options.skin_tone || 0);

        // 头发滤镜
        const hairRecord = setup.colours.hair_map?.[options.hair_colour];
        if (hairRecord?.canvasfilter) {
            options.filters.hair = clone(hairRecord.canvasfilter);
        }

        // 刘海滤镜（如果有单独颜色）
        const fringeColour = options.hair_fringe_colour || options.hair_colour;
        const fringeRecord = setup.colours.hair_map?.[fringeColour];
        if (fringeRecord?.canvasfilter) {
            options.filters.hair_fringe = clone(fringeRecord.canvasfilter);
        } else {
            options.filters.hair_fringe = options.filters.hair;
        }

        // 眼睛滤镜
        const leftEyeRecord = setup.colours.eyes_map?.[options.left_eye];
        if (leftEyeRecord?.canvasfilter) {
            options.filters.left_eye = clone(leftEyeRecord.canvasfilter);
        }
        const rightEyeRecord = setup.colours.eyes_map?.[options.right_eye];
        if (rightEyeRecord?.canvasfilter) {
            options.filters.right_eye = clone(rightEyeRecord.canvasfilter);
        }

        // 衣服滤镜
        if (options.clothes) {
            for (const clothe of options.clothes) {
                if (!clothe?.slot) continue;
                
                // 主颜色滤镜
                if (clothe.colour) {
                    const colourRecord = setup.colours.clothes_map?.[clothe.colour];
                    if (colourRecord?.canvasfilter) {
                        options.filters[`worn_${clothe.slot}`] = clone(colourRecord.canvasfilter);
                    }
                }
                // 配件颜色滤镜
                if (clothe.accColour) {
                    const accRecord = setup.colours.clothes_map?.[clothe.accColour];
                    if (accRecord?.canvasfilter) {
                        options.filters[`worn_${clothe.slot}_acc`] = clone(accRecord.canvasfilter);
                    }
                }
            }
        }
    },

    layers: {
        // === 侧发后面部分（back.png 如果存在）===
        "sides_back": {
            z: FumoZIndices.sidesBack,
            filters: ["hair"],
            animation: "idle",
            showfn(options) {
                if (!options.show_hair || !options.hair_sides_type) return false;
                const style = options.hair_sides_type;
                const path = `${options.basePath}hair/sides/${style}/back.png`;
                return checkImageExists(path);
            },
            srcfn(options) {
                const style = options.hair_sides_type;
                return `${options.basePath}hair/sides/${style}/back.png`;
            }
        },

        // === 身体 ===
        "body": {
            show: true,
            z: FumoZIndices.body,
            filters: ["skin"],
            animation: "idle",
            srcfn(options) { return `${options.basePath}body/bodynoarms.png`; }
        },
        "arms": {
            show: true,
            z: FumoZIndices.body + 1,
            filters: ["skin"],
            animation: "idle",
            srcfn(options) { return `${options.basePath}body/arms.png`; }
        },

        // === 头部 ===
        "head": {
            z: FumoZIndices.head,
            filters: ["skin"],
            animation: "idle",
            showfn(options) { return options.show_face; },
            srcfn(options) { return `${options.basePath}body/head.png`; }
        },
        "eyes": {
            z: FumoZIndices.eyes,
            animation: "idle",
            showfn(options) { return options.show_face; },
            srcfn(options) { return `${options.basePath}face/eyes.png`; }
        },
        "iris": {
            z: FumoZIndices.iris,
            filters: ["eyes"],
            animation: "idle",
            showfn(options) { return options.show_face; },
            srcfn(options) { return `${options.basePath}face/iris.png`; }
        },
        "expression": {
            z: FumoZIndices.expression,
            animation: "idle",
            showfn(options) { return options.show_face; },
            srcfn(options) { return `${options.basePath}face/facial/${options.expression}.png`; }
        },

        // === 侧发（在前发/刘海下面）===
        "sides_hair": {
            z: FumoZIndices.sidesHair,
            filters: ["hair"],
            animation: "idle",
            showfn(options) {
                if (!options.show_hair || !options.hair_sides_type) return false;
                const style = options.hair_sides_type;
                const path = `${options.basePath}hair/sides/${style}/full.png`;
                return checkImageExists(path);
            },
            srcfn(options) {
                const style = options.hair_sides_type;
                return `${options.basePath}hair/sides/${style}/full.png`;
            }
        },

        // === 前发/刘海（最上层头发）===
        "fringe_hair": {
            z: FumoZIndices.frontHair,
            filters: ["hair_fringe"],
            animation: "idle",
            showfn(options) { return options.show_hair && !!options.hair_fringe_type; },
            srcfn(options) {
                const style = options.hair_fringe_type;
                const path = `${options.basePath}hair/fringe/${style}/full.png`;
                if (checkImageExists(path)) {
                    return path;
                }
                return `${options.basePath}hair/default.png`;
            }
        },

        // === 衣服图层 - 为每个槽位预定义 ===
        // under_lower
        "clothes_under_lower": createClothingLayer(ClothingSlots[0], false),
        "clothes_under_lower_acc": createClothingLayer(ClothingSlots[0], true),
        
        // under_upper
        "clothes_under_upper": createClothingLayer(ClothingSlots[1], false),
        "clothes_under_upper_acc": createClothingLayer(ClothingSlots[1], true),
        
        // lower
        "clothes_lower": createClothingLayer(ClothingSlots[2], false),
        "clothes_lower_acc": createClothingLayer(ClothingSlots[2], true),
        
        // upper
        "clothes_upper": createClothingLayer(ClothingSlots[3], false),
        "clothes_upper_acc": createClothingLayer(ClothingSlots[3], true),
        
        // over_lower
        "clothes_over_lower": createClothingLayer(ClothingSlots[4], false),
        "clothes_over_lower_acc": createClothingLayer(ClothingSlots[4], true),
        
        // over_upper
        "clothes_over_upper": createClothingLayer(ClothingSlots[5], false),
        "clothes_over_upper_acc": createClothingLayer(ClothingSlots[5], true),
        
        // feet
        "clothes_feet": createClothingLayer(ClothingSlots[6], false),
        "clothes_feet_acc": createClothingLayer(ClothingSlots[6], true),
        
        // legs
        "clothes_legs": createClothingLayer(ClothingSlots[7], false),
        "clothes_legs_acc": createClothingLayer(ClothingSlots[7], true),
        
        // head (衣服)
        "clothes_head": createClothingLayer(ClothingSlots[8], false),
        "clothes_head_acc": createClothingLayer(ClothingSlots[8], true),
        
        // face (衣服)
        "clothes_face": createClothingLayer(ClothingSlots[9], false),
        "clothes_face_acc": createClothingLayer(ClothingSlots[9], true),

        // === Pattern 图层 ===
        "pattern_under_lower": createPatternLayer(ClothingSlots[0]),
        "pattern_under_upper": createPatternLayer(ClothingSlots[1]),
        "pattern_lower": createPatternLayer(ClothingSlots[2]),
        "pattern_upper": createPatternLayer(ClothingSlots[3]),
        "pattern_over_lower": createPatternLayer(ClothingSlots[4]),
        "pattern_over_upper": createPatternLayer(ClothingSlots[5]),
        "pattern_feet": createPatternLayer(ClothingSlots[6]),
        "pattern_legs": createPatternLayer(ClothingSlots[7]),
        "pattern_head": createPatternLayer(ClothingSlots[8]),
        "pattern_face": createPatternLayer(ClothingSlots[9])
    }
};

window.FumoZIndices = FumoZIndices;
window.ClothingSlots = ClothingSlots;
window.findClothingImage = findClothingImage;
