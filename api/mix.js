const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

module.exports = async (req, res) => {
  let ttsFilePath = null;
  let outputFilePath = null;

  try {
    const { ttsAudioBase64, backgroundTrackFilename, musicVolume } = req.body;

    if (!ttsAudioBase64 || !backgroundTrackFilename) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Decode TTS audio
    const ttsBuffer = Buffer.from(ttsAudioBase64, 'base64');
    ttsFilePath = path.join(__dirname, '../temp', `tts-${Date.now()}.mp3`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(ttsFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    await writeFile(ttsFilePath, ttsBuffer);

    // Load background music
    const musicFilePath = path.join(process.cwd(), 'music', backgroundTrackFilename);
    
    if (!fs.existsSync(musicFilePath)) {
      return res.status(404).json({ error: 'Background music file not found' });
    }

    // Calculate volume ratio (musicVolume is 0-1, TTS should be louder)
    const ttsVolume = 1.0;
    const musicVolumeRatio = musicVolume || 0.3;

    // Create output file
    outputFilePath = path.join(tempDir, `mixed-${Date.now()}.mp3`);

    // Mix audio using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(ttsFilePath)
        .input(musicFilePath)
        .complexFilter([
          `[0:a]volume=${ttsVolume}[v0]`,
          `[1:a]volume=${musicVolumeRatio}[v1]`,
          '[v0][v1]amix=inputs=2:duration=first:dropout_transition=2'
        ])
        .output(outputFilePath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Read the mixed file and send as base64
    const mixedAudio = fs.readFileSync(outputFilePath);
    const base64 = mixedAudio.toString('base64');

    // Cleanup temp files
    await unlink(ttsFilePath).catch(() => {});
    await unlink(outputFilePath).catch(() => {});

    res.json({ audio: base64, format: 'mp3' });
  } catch (error) {
    console.error('Error mixing audio:', error);
    
    // Cleanup on error
    if (ttsFilePath) await unlink(ttsFilePath).catch(() => {});
    if (outputFilePath) await unlink(outputFilePath).catch(() => {});

    res.status(500).json({ error: 'Failed to mix audio', details: error.message });
  }
};

