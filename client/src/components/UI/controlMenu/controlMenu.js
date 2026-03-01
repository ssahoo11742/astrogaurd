import { useState } from "react"

export const Menu = ({setShowNEO, setShowPHA, showNEO, showComet, setShowComet}) => {
    return (
        <>
            <button className="btn" onClick={() => document.getElementById('panel').showModal()}>Control Panel</button>
            <dialog id="panel" className="modal ">
                <div className="modal-box">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold text-lg">Control Panel</h3>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <span className="flex items-center">
                            <input id="asteroids-checkbox" type="checkbox" defaultChecked={showNEO} onClick={(event) => setShowNEO(event.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                            <label htmlFor="asteroids-checkbox" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Asteroids</label>
                        </span>

                      <span className="flex items-center">
                            <input id="comets-checkbox" type="checkbox" defaultChecked={showComet} onClick={(event) => setShowComet(event.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                            <label htmlFor="comets-checkbox" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Comets</label>
                        </span>

                        <span className="flex items-center">
                            <input id="highlight-phas-checkbox" type="checkbox" onClick={(event) => setShowPHA(event.currentTarget.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                            <label htmlFor="highlight-phas-checkbox" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300" >Highlight PHAs</label>
                        </span>


                    </div>
                </div>
            </dialog>
        </>
    )
}
