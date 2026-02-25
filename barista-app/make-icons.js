const sharp = require('sharp');
const fs = require('fs');

const sizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
};

const iconPath = 'app-icon.svg';

async function generate() {
    for (const [res, size] of Object.entries(sizes)) {
        const dir = `android/app/src/main/res/mipmap-${res}`;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const outPath = `${dir}/ic_launcher.png`;
        await sharp(iconPath)
            .resize(size, size)
            .toFile(outPath);

        const outRoundPath = `${dir}/ic_launcher_round.png`;
        await sharp(iconPath)
            .resize(size, size) // The SVG itself has a natural rounded/app icon feel so mapping directly works.
            .toFile(outRoundPath);

        console.log(`Generated ${res}`);
    }

    // Remove any vector XMLs to force OS to use our new legacy PNGs
    fs.rmSync('android/app/src/main/res/mipmap-anydpi-v26', { recursive: true, force: true });
}

generate().catch(console.error);
