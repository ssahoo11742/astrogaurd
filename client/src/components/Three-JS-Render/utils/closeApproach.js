export const impactStats = async (des) => {
    try {
        const response = await fetch(`https://ssd-api.jpl.nasa.gov/sentry.api?des=${des}`);
        if (!response.ok) {
            throw new Error("SIGMNA");
        }
        const data = await response.json();

        if (data.error) {
            const ps_cum = 0;
            const ts_max = 0;
            const ip = 0;
            const n_imp = 0;
            return { ps_cum, ts_max, ip, n_imp };
        } else {
            const summary = data.summary;
            const ps_cum = summary.ps_cum;
            const ts_max = summary.ts_max;
            const ip = summary.ip;
            const n_imp = summary.n_imp;
            return {ps_cum, ts_max, ip, n_imp };
        }
    } catch (error) {
        const ps_cum = 0;
        const ts_max = 0;
        const ip = 0;
        const n_imp = 0;
        return { ps_cum, ts_max, ip, n_imp };
    }
};



export const closeApproachStats = async (des) => {

    try{
    const response = await fetch(`https://ssd-api.jpl.nasa.gov/cad.api?des=${des}&date-min=2024-09-27&date-max=2100-01-01&dist-max=0.2`);
        if (!response.ok) {
            throw new Error("SIGMNA");
        }
        const data = await response.json();

        if (data.error) {
            
        } else {
            const count = data.count;
            const next = data.data[0][3];
            return({count, next});
        }
    } catch (error) {
        const count = 0;
        const next = "None";
        return({count, next});
    }
}
