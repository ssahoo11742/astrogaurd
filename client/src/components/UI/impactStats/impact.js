export const ImpactStats = ({impactStats}) => {
    const ps_cum = impactStats.ps_cum;
    const ts_max = impactStats.ts_max;
    const ip = impactStats.ip;
    const n_imp = impactStats.n_imp
    return(
        <>

            <div className="bg-black bg-opacity-50 border-white border p-5 rounded-lg">
                <div className="text-xl text-white font-bold mb-3">
                    Impact Stats
                </div>

                <div className="text-white text-lg"><b>Palerno Score (Cum.)</b> :  {ps_cum}</div>

                <div className="text-white text-lg"><b>Torino Score (Max)</b> :  {ts_max}</div>

                <div className="text-white text-lg"><b>Impact Probability</b> :  {`${(parseFloat(ip) * 100).toFixed(2)}%`}</div>

                <div className="text-white text-lg"><b># of Potential Impacts</b> :  {n_imp}</div>
     
             </div>


        </>
    )
    
}