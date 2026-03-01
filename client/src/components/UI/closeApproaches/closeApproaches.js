export const CloseApproach = ({closeApproachData}) => {
    const next = closeApproachData.next;
    const count = closeApproachData.count;

    return(
        <>

            <div className="bg-black bg-opacity-50 border-white border p-5 rounded-lg">
                <div className="text-xl text-white font-bold mb-3">
                    Close Approach Data
                </div>

                
                <div className="text-white text-lg"><b># Of Close Approaches Until Year 2100</b> :  {count}</div>

                <div className="text-white text-lg"><b>Next Close Approach Date</b> :  {next}</div>
     
             </div>


        </>
    )
    
}