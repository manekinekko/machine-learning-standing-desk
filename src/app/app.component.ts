import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  @ViewChild('video', { static: true }) video: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement>;
  streaming = false;
  height = 100;
  width = 100;

  predictionLabel = 'Unknown';
  predictionConfidence = '0.00';

  async ngOnInit(): Promise<void> {
    await this.getMedia();

    setInterval(async (_) => await this.predict(), 1000);

    this.video.nativeElement.addEventListener(
      'canplay',
      (ev) => {
        if (!this.streaming) {
          this.height =
            this.video.nativeElement.videoHeight /
            (this.video.nativeElement.videoWidth / this.width);

          this.video.nativeElement.setAttribute('width', `${this.width}`);
          this.video.nativeElement.setAttribute('height', `${this.height}`);
          this.canvas.nativeElement.setAttribute('width', `${this.width}`);
          this.canvas.nativeElement.setAttribute('height', `${this.height}`);
          this.streaming = true;
        }
      },
      false
    );
  }

  async predict(): Promise<void> {
    const data = this.snapshot();
    const response = await fetch(
      'http://localhost:38100/predict/2981ee27-3ecd-4c4e-b0b7-abd2960fcf5f',
      {
        method: 'post',
        body: JSON.stringify({
          inputs: {
            Image: data,
          },
        }),
      }
    );

    const json = await response.json();
    const pred = json.outputs?.Prediction?.pop();
    const predConfidence = json.outputs.Labels.filter(el => el[0] === pred).pop();

    if (pred !== this.predictionLabel) {
      this.predictionLabel = pred;
      this.predictionConfidence = Number(predConfidence[1]).toFixed(2);
      // await this.setDeskPosition(this.predictionLabel);
    }
  }

  async setDeskPosition(position: string): Promise<void> {
    const modes = {
      Standing: 2,
      Sitting: 1,
    };

    if (modes[position]) {
      const res = await fetch(
        `http://192.168.86.37:1337/mode/${modes[position]}`
      );
    }
  }

  snapshot(): string {
    const context = this.canvas.nativeElement.getContext('2d');
    if (this.width && this.height) {
      this.canvas.nativeElement.width = this.width;
      this.canvas.nativeElement.height = this.height;
      context.drawImage(
        this.video.nativeElement,
        0,
        0,
        this.width,
        this.height
      );

      return this.canvas.nativeElement
        .toDataURL()
        .replace('data:image/png;base64,', '');
    } else {
      return null;
    }
  }

  async getMedia(): Promise<void> {
    let stream = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      this.video.nativeElement.srcObject = stream;
      this.video.nativeElement.play();
    } catch (err) {
      console.error(err);
    }
  }
}
