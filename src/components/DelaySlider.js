import React from 'react';
import './Slider.css';

const DelaySlider = (props) => {

    function handleChange(evt) {
        props.updateDelay(evt.target.value)
    }

    return (
      <div>
        <input className="delay-slider" type="range" min="0.0" max="1.0" step="0.1" value={props.delay} onChange={handleChange}></input>
      </div>
    )
}

export default DelaySlider;
