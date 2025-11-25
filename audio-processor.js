// AudioWorklet Processor for low-latency audio capture
// This replaces the deprecated ScriptProcessorNode for ~10x lower latency

class AudioCaptureProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 4096; // Match previous buffer size
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
        this.isRecording = false;

        // Listen for recording state changes
        this.port.onmessage = (event) => {
            if (event.data.type === 'setRecording') {
                this.isRecording = event.data.value;
            }
        };
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];

        if (!input || !input[0]) {
            return true; // Keep processor alive
        }

        const inputChannel = input[0];

        // Calculate RMS volume for visualization
        let sum = 0;
        for (let i = 0; i < inputChannel.length; i++) {
            sum += inputChannel[i] * inputChannel[i];
        }
        const rms = Math.sqrt(sum / inputChannel.length);

        // Send volume updates
        this.port.postMessage({
            type: 'volume',
            value: rms
        });

        // Only buffer and send audio when recording
        if (this.isRecording) {
            // Accumulate audio data into buffer
            for (let i = 0; i < inputChannel.length; i++) {
                this.buffer[this.bufferIndex++] = inputChannel[i];

                // When buffer is full, send it
                if (this.bufferIndex >= this.bufferSize) {
                    // Create a copy of the buffer to send
                    const audioData = new Float32Array(this.buffer);

                    this.port.postMessage({
                        type: 'audio',
                        data: audioData
                    });

                    this.bufferIndex = 0;
                }
            }
        } else {
            // Reset buffer when not recording
            this.bufferIndex = 0;
        }

        return true; // Keep processor alive
    }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
