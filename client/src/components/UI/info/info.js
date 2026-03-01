import { useState } from "react"

export const InfoBox = ({displayData}) =>{

    const [show, setShow] = useState(true)
    const hide = () =>{
        setShow(false)
    }

    const unhide = () =>{
        setShow(true)
    }

    return(
        <>
        {show ? 
            <div className="bg-black bg-opacity-50 border-white border p-5 rounded-lg">
                <div className="text-xl text-white font-bold mb-3">
                     {displayData.name} 
                     <button className="absolute right-0 me-5 border border-white rounded-full w-1/12 h-1/12" onClick={hide}> &lt; </button>
                 </div>
     
                <hr className="mb-2"></hr>
     
                 <div>
                     <span className="text-white font-bold text-lg">Diameter (km):</span> {displayData.diameter}
                 </div>
     
                 <div>
                 <span className="text-white font-bold text-lg">Orbital Period (d):</span> {displayData.orbPer}
                 </div>
     
                 <div>
                 <span className="text-white font-bold text-lg">Rotational Period (h):</span> {displayData.rotPer}
                 </div>
     
                 <div>
                 <span className="text-white font-bold text-lg">Orbit Producer:</span> {displayData.producer}
                 </div>
     
                 <div>
                 <span className="text-white font-bold text-lg">Geometric Albedo:</span> {displayData.albedo}
                 </div>
             </div>
                : 
                
            <button className="me-5 border border-white rounded-full w-1/12 h-1/12 text-white font-bold text-lg" onClick={unhide}> &gt; </button>
            }

        </>
    )
}