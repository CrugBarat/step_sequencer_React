import React, {Component, Fragment} from 'react';
import './StepSequencer.css';
import Tone from 'tone';
import BPMSlider from '../components/BPMSlider';
import SwingSlider from '../components/SwingSlider';
import GainSlider from '../components/GainSlider';
import DelaySlider from '../components/DelaySlider';
import SynthSelect from '../components/SynthSelect';

class StepSequencer extends Component {
  constructor() {
    super();

    this.state = {
      notes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
      synths: [new Tone.PolySynth(), new Tone.AMSynth(), new Tone.DuoSynth(), new Tone.FMSynth(), new Tone.MembraneSynth(), new Tone.MonoSynth(), new Tone.PluckSynth()],
      rows: document.body.querySelectorAll('div > div'),
      index: 0,
      bpm: 120,
      swing: 0.0,
      gain: 1.0,
      currentNote: 'C3',
      delay: 0.0,
      synthChoices: ['AMSynth', 'DuoSynth', 'FMSynth', 'MembraneSynth', 'MonoSynth', 'PluckSynth', 'PolySynth'],
      synthArr: [],
      eventID: 0,
      playing: false,
      recDest: Tone.context.createMediaStreamDestination(),
      recorder: null,
      recording: false
    }

    this.getRows = this.getRows.bind(this);
    this.startSynth = this.startSynth.bind(this);
    this.stopSynth = this.stopSynth.bind(this);
    this.stopMedia = this.stopMedia.bind(this);
    this.repeat = this.repeat.bind(this);
    this.clearSequencer = this.clearSequencer.bind(this);
    this.updateBPM = this.updateBPM.bind(this);
    this.updateSwing = this.updateSwing.bind(this);
    this.updateGain = this.updateGain.bind(this);
    this.reduceOctave = this.reduceOctave.bind(this);
    this.increaseOctave = this.increaseOctave.bind(this);
    this.updateDelay = this.updateDelay.bind(this);
    this.resetDelay = this.resetDelay.bind(this);
    this.onSynthSelect = this.onSynthSelect.bind(this);
    this.makeSynthArr = this.makeSynthArr.bind(this);
    this.recordStart = this.recordStart.bind(this);
    this.recordStop = this.recordStop.bind(this);
  }

  componentDidMount() {
    this.getRows();
    this.makeSynthArr(0);
  }

  getRows() {
    const rows = document.body.querySelectorAll('section > div');
    this.setState({rows: rows});
  }

  makeSynthArr(choice) {
    const synthArr = [];
    for(let i=0; i<8; i++) {
      synthArr.push(this.state.synths[choice])
    }
    this.setState({synthArr: synthArr})
  }

  startSynth() {
    if(!this.state.playing) {
      this.stopSynth();
      this.state.synthArr.forEach(synth => synth.connect(this.state.recDest));
      this.state.synthArr.forEach(synth => synth.toMaster());
      const eventID = Tone.Transport.scheduleRepeat(this.repeat, '8n');
      this.setState({eventID: eventID});
      Tone.Transport.start();
      this.setState({playing: true});
    }
  }

  stopSynth() {
    Tone.Transport.stop();
    Tone.Transport.clear(this.state.eventID);
    this.setState({index: 0});
    this.setState({playing: false})
  }

  stopMedia() {
    if(this.state.recording) {
      this.recordStop();
    }
    this.stopSynth();
  }

  repeat() {
    let step = this.state.index % 8;
    for (let i = 0; i < this.state.synthArr.length; i++) {
      let synth = this.state.synthArr[i];
      let note = this.state.notes[i];
      let row = this.state.rows[i];
      console.log(row);
      console.log(step);
      let input = row.querySelector(`input:nth-child(${step + 1})`);
      if (input.checked) synth.triggerAttackRelease(note, '8n');
    }
    this.setState({index: this.state.index + 1});
  }

  clearSequencer() {
    this.stopSynth();
    const inputs = document.body.querySelectorAll('input');
    for(let i =0; i<inputs.length; i++) {
      inputs[i].checked = false;
    }
  }

  updateBPM(bpm) {
    this.setState({bpm: parseInt(bpm)});
    Tone.Transport.bpm.value = this.state.bpm;
  }

  updateSwing(swing) {
    this.setState({swing: parseFloat(swing)});
    Tone.Transport.swing = this.state.swing;
  }

  updateGain(gain) {
    this.state.synths.forEach(synth => synth.disconnect());
    this.setState({gain: parseFloat(gain)});
    const newGain = new Tone.Gain(this.state.gain);
    newGain.toMaster();
    this.state.synths.forEach(synth => synth.connect(newGain));
    this.setState({delay: 0});
  }

  updateDelay(delay) {
    this.state.synths.forEach(synth => synth.disconnect());
    this.setState({delay: parseFloat(delay)});
    const pingPong = new Tone.PingPongDelay("4n", this.state.delay).toMaster();
    this.state.synths.forEach(synth => synth.connect(pingPong));
  }

  resetDelay() {
    this.state.synths.forEach(synth => synth.disconnect());
    this.state.synths.forEach(synth => synth.toMaster());
    this.setState({delay: 0});
  }

  reduceOctave() {
    if(this.state.notes[7].split('')[1] === '1') return;
    const newNotes = this.state.notes.map(note => note.split('')).map(note => note[0] + (parseInt(note[1])-1).toString());
    this.setState({notes: newNotes});
    this.setState({currentNote: newNotes[7]});
  }

  increaseOctave() {
    if(this.state.notes[7].split('')[1] === '8') return;
    const newNotes = this.state.notes.map(note => note.split('')).map(note => note[0] + (parseInt(note[1])+1).toString());
    this.setState({notes: newNotes});
    this.setState({currentNote: newNotes[7]});
  }

  onSynthSelect(synth) {
    if(synth === 'AMSynth') {
        this.makeSynthArr(1);
        this.setState({playing: false});
    } else if (synth === 'DuoSynth') {
        this.makeSynthArr(2);
        this.setState({playing: false});
    } else if (synth === 'FMSynth') {
        this.makeSynthArr(3);
        this.setState({playing: false});
    } else if (synth === 'MembraneSynth') {
        this.makeSynthArr(4);
        this.setState({playing: false});
    } else if (synth === 'MonoSynth') {
        this.makeSynthArr(5);
        this.setState({playing: false});
    } else if (synth === 'PluckSynth') {
        this.makeSynthArr(6);
        this.setState({playing: false});
    } else {
        this.makeSynthArr(0);
        this.setState({playing: false});
    }
  }

  recordStart() {
    const recorder = new MediaRecorder(this.state.recDest.stream, {'type': 'audio/wav'});
    this.setState({recorder: recorder});
    this.setState({recording: true});
    recorder.start();
  }

  recordStop() {
    if(this.state.recorder != null) {
      this.setState({recording: false})
      this.state.recorder.stop();
      this.clearSequencer();
      this.setState({recorder: null});
      const recChunks = [];
      this.state.recorder.ondataavailable = evt => recChunks.push(evt.data);
      this.state.recorder.onstop = evt => {
        let blob = new Blob(recChunks, {'type': 'audio/wav'});
        const audioURL = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.color = 'white';
        link.style.cssText = "font-size: 20px; color: white;"
        link.href = audioURL;
        link.download = 'my_recording';
        link.innerHTML = 'DOWNLOAD FILE';
        document.body.appendChild(link);
      };
    }
  }

  render() {
    return (
      <Fragment>
        <section className="controls-container">
          <div>
            <input className="row1" type="checkbox" />
            <input className="row1" type="checkbox" />
            <input className="row1" type="checkbox" />
            <input className="row1" type="checkbox" />
            <input className="row1" type="checkbox" />
            <input className="row1" type="checkbox" />
            <input className="row1" type="checkbox" />
            <input className="row1" type="checkbox" />
          </div>
          <div>
            <input className="row2" type="checkbox" />
            <input className="row2" type="checkbox" />
            <input className="row2" type="checkbox" />
            <input className="row2" type="checkbox" />
            <input className="row2" type="checkbox" />
            <input className="row2" type="checkbox" />
            <input className="row2" type="checkbox" />
            <input className="row2" type="checkbox" />
          </div>
          <div>
            <input className="row3" type="checkbox" />
            <input className="row3" type="checkbox" />
            <input className="row3" type="checkbox" />
            <input className="row3" type="checkbox" />
            <input className="row3" type="checkbox" />
            <input className="row3" type="checkbox" />
            <input className="row3" type="checkbox" />
            <input className="row3" type="checkbox" />
          </div>
          <div>
            <input className="row4" type="checkbox" />
            <input className="row4" type="checkbox" />
            <input className="row4" type="checkbox" />
            <input className="row4" type="checkbox" />
            <input className="row4" type="checkbox" />
            <input className="row4" type="checkbox" />
            <input className="row4" type="checkbox" />
            <input className="row4" type="checkbox" />
          </div>
          <div>
            <input className="row5" type="checkbox" />
            <input className="row5" type="checkbox" />
            <input className="row5" type="checkbox" />
            <input className="row5" type="checkbox" />
            <input className="row5" type="checkbox" />
            <input className="row5" type="checkbox" />
            <input className="row5" type="checkbox" />
            <input className="row5" type="checkbox" />
          </div>
          <div>
            <input className="row6" type="checkbox" />
            <input className="row6" type="checkbox" />
            <input className="row6" type="checkbox" />
            <input className="row6" type="checkbox" />
            <input className="row6" type="checkbox" />
            <input className="row6" type="checkbox" />
            <input className="row6" type="checkbox" />
            <input className="row6" type="checkbox" />
          </div>
          <div>
            <input className="row7" type="checkbox" />
            <input className="row7" type="checkbox" />
            <input className="row7" type="checkbox" />
            <input className="row7" type="checkbox" />
            <input className="row7" type="checkbox" />
            <input className="row7" type="checkbox" />
            <input className="row7" type="checkbox" />
            <input className="row7" type="checkbox" />
          </div>
          <div>
            <input className="row8" type="checkbox" />
            <input className="row8" type="checkbox" />
            <input className="row8" type="checkbox" />
            <input className="row8" type="checkbox" />
            <input className="row8" type="checkbox" />
            <input className="row8" type="checkbox" />
            <input className="row8" type="checkbox" />
            <input className="row8" type="checkbox" />
          </div>

            <div className="values-border">
              <div className="values-container">
                <h3 className="values">{this.state.currentNote} <p className="units">Note</p></h3>
                <h3 className="values">{this.state.swing} <p className="units">Swing</p></h3>
                <h3 className="values">{this.state.delay} <p className="units">Delay</p></h3>
                <h3 className="values">{this.state.gain} <p className="units">Gain</p></h3>
                <h3 className="values">{this.state.bpm} <p className="units">BPM</p></h3>
              </div>
            </div>
            <div className="sliders-container">
              <div className="slider-value">
                <p>BPM</p>
              </div>
              <div className="slider-container">
                <BPMSlider className="bpm-slider" updateBPM={this.updateBPM} bpm={this.state.bpm} />
              </div>
              <div className="slider-value">
                <p>SWING</p>
              </div>
              <div className="slider-container">
                <SwingSlider className="swing-slider" updateSwing={this.updateSwing} swing={this.state.swing} />
              </div>
              <div className="slider-value">
                <p>DELAY</p>
              </div>
              <div className="slider-container">
                <DelaySlider className="delay-slider" updateDelay={this.updateDelay} delay={this.state.delay} />
              </div>
              <div className="slider-value">
                <p>GAIN</p>
              </div>
              <div className="slider-container">
                <GainSlider className="gain-slider" updateGain={this.updateGain} gain={this.state.gain} />
              </div>
            </div>
            <div className="media-border">
              <div className="media-controls-container">
                <div className="main-control">
                  <button name="play" onClick={this.startSynth}></button>
                </div>
                  <div className="sub-controls">
                  <div>
                    <button name="record" onClick={this.recordStart}></button>
                  </div>
                  <div>
                    <button name="stop" onClick={this.stopMedia}></button>
                  </div>
                </div>
              </div>
            </div>
            <SynthSelect synthChoices={this.state.synthChoices} onSynthSelect={this.onSynthSelect}/>
            <div className="oct-container">
             <button className="oct-decrease-button" onClick={this.reduceOctave}>-</button>
             <span> OCT </span>
             <button className="oct-increase-button" onClick={this.increaseOctave}>+</button>
           </div>
            <div>
              <button className="destroy-buttons" onClick={this.resetDelay}>RESET DELAY</button>
              <button className="destroy-buttons" onClick={this.clearSequencer}>CLEAR</button>
            </div>
        </section>
      </Fragment>
    )
  }
}

export default StepSequencer;
