class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 4096; // Adjust for latency/stability trade-off
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const inputChannel = input[0];

        // Simple downsampling or buffer filling
        // For now, just fill buffer and send
        for (let i = 0; i < inputChannel.length; i++) {
            this.buffer[this.bufferIndex++] = inputChannel[i];

            if (this.bufferIndex >= this.bufferSize) {
                // Send buffer to main thread
                this.port.postMessage(this.buffer.slice(0, this.bufferSize));
                this.bufferIndex = 0;
            }
        }

        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
