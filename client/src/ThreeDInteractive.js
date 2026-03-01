import AsteroidTracker from './components/Three-JS-Render/AsteroidTracker.js';
import { Slider } from './components/UI/slider/slider.js';
import { Timeline } from './components/UI/timeline/timeline.js';
import { Menu } from './components/UI/controlMenu/controlMenu.js';
import { TargetRemove } from './components/UI/targetRemove/targetRemove.js';
import { Search } from './components/UI/search/search.js';
import { InfoBox } from './components/UI/info/info.js';
import { ImpactStats } from './components/UI/impactStats/impact.js';
import { CloseApproach } from './components/UI/closeApproaches/closeApproaches.js';
import styles from "./index.css";
import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import Logo from './logo.png'

// Disabling native browser zoom so threejs zoom doesn't get interrupted
document.addEventListener('wheel', event => {
    const { ctrlKey } = event;
    if (ctrlKey) {
        event.preventDefault();
        return;
    }
}, { passive: false });

const ThreeDInteractive = () => {
    const [showPHA, setShowPHA] = useState(false);
    const [showNEO, setShowNEO] = useState(true);
    const [showComet, setShowComet] = useState(true);
    const speed = useRef(0); // Moved speed state here
    const [viewDate, setViewDate] = useState(new Date()); 
    const [target, setTarget] = useState(new THREE.Vector3(0,0,0))
    const [followingBody, setFollowingBody] = useState(null);    
    const [asteroidSize, setAsteroidSize] = useState(1);
    const t = useRef(0);
    const [labeledBodies, setLabeledBodies] = useState({"Mercury":"#dabaff", "Venus":"#fa9a41", "Earth":"#1fb0e0", "Mars":"#e0521f", "Jupiter":"#f2a285", "Saturn":"#e0d665", "Uranus":"#8ee6e4", "Neptune":"#4534fa"});
    const [displayData, setDisplayData] = useState({});
    const [impactData, setImpactData] = useState(0);
    const [closeApproachData, setCloseApproachData] = useState(0);
    
    return (
        <>
        <div className="relative h-screen bg-gradient-to-r from-blue-400 to-purple-500">
            {/* 3D Scene */}
            <div className="absolute inset-0 z-10">
                <AsteroidTracker speed={speed} setViewDate={setViewDate} t={t} showNEO={showNEO} showPHA={showPHA} showComet={showComet} target={target} followingBody={followingBody} setTarget={setTarget} setFollowingBody={setFollowingBody} setAsteroidSize={setAsteroidSize} asteroidSize={asteroidSize} labeledBodies={labeledBodies} setDisplayData={setDisplayData} setImpactData={setImpactData} setCloseApproachData={setCloseApproachData}/>
            </div>

            {/* UI overlay */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-white z-20">
                <div className="w-4/12 max-w-3xl px-4 py-2">
                    <Slider speed={speed} t={t} />
                </div>
                <div className="w-full max-w-3xl px-4 py-2 mt-4">
                    <Timeline viewDate={viewDate} t={t} />
                </div>
            </div>

            {/* To unfollow following body */}
            <div className='absolute top-0 left-0 z-50 m-4'>
                {followingBody ? <TargetRemove setTarget={setTarget} setFollowingBody={setFollowingBody} setAsteroidSize={setAsteroidSize}/>: null}
            </div>

            {/* Search Menu */}
            <div className="absolute top-0 right-0 z-20 flex space-x-4 m-4 w-full">
                <Search setLabeledBodies={setLabeledBodies} />
                <Menu setShowNEO={setShowNEO} setShowPHA={setShowPHA} showNEO={showNEO} showComet={showComet} setShowComet={setShowComet}/>
            </div>

            <div className="absolute bottom-0 left-0 z-50 m-4">
                <img src={Logo} alt="Description" className="w-32 h-auto" /> {/* Adjust size as needed */}
            </div>
            
            {/* Info, Impact, and CloseApproach stacked vertically */}
            <div className="absolute top-0 left-0 z-20 flex flex-col space-y-4 ms-5" style={{ marginTop: "15%", height: "70vh", overflowY: "auto" }}>
                {followingBody && (
                    <>
                        <div className="w-72 flex-grow overflow-y-auto max-h-1/3">
                            <InfoBox displayData={displayData} />
                        </div>
                        <div className="w-72 flex-grow overflow-y-auto max-h-1/3">
                            <ImpactStats impactStats={impactData} />
                        </div>
                        <div className="w-72 flex-grow overflow-y-auto max-h-1/3">
                            <CloseApproach closeApproachData={closeApproachData} />
                        </div>
                    </>
                )}
            </div>
        </div>
        </>
    );
};

export default ThreeDInteractive;
