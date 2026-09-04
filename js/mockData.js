
export const initialMockData = () => {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    
    // Fechas dinámicas del mes actual
    const d1 = `${año}-${mes}-01`;
    const d2 = `${año}-${mes}-02`;
    const d3 = `${año}-${mes}-03`;

    return {
        "mock_01": {
            "user": "Alex",
            "type": "Entrada",
            "detail": "Presencial",
            "timestamp": `${d1}T08:00:00.000Z`,
            "dateStr": `1/${ahora.getMonth() + 1}/${año}`,
            "fullTime": new Date(`${d1}T08:00:00.000Z`).getTime()
        },
        "mock_02": {
            "user": "Alex",
            "type": "Salida",
            "detail": "Fin de jornada",
            "timestamp": `${d1}T16:30:00.000Z`,
            "dateStr": `1/${ahora.getMonth() + 1}/${año}`,
            "fullTime": new Date(`${d1}T16:30:00.000Z`).getTime()
        },
        "mock_03": {
            "user": "Sam",
            "type": "Entrada",
            "detail": "Presencial",
            "timestamp": `${d2}T09:00:00.000Z`,
            "dateStr": `2/${ahora.getMonth() + 1}/${año}`,
            "fullTime": new Date(`${d2}T09:00:00.000Z`).getTime()
        },
        "mock_04": {
            "user": "Sam",
            "type": "Salida",
            "detail": "Fin de jornada",
            "timestamp": `${d2}T17:00:00.000Z`,
            "dateStr": `2/${ahora.getMonth() + 1}/${año}`,
            "fullTime": new Date(`${d2}T17:00:00.000Z`).getTime()
        },
        "mock_05": {
            "user": "Alex",
            "type": "Gasto",
            "detail": "Insumos de oficina: $1250",
            "timestamp": `${d3}T11:15:00.000Z`,
            "dateStr": `3/${ahora.getMonth() + 1}/${año}`,
            "fullTime": new Date(`${d3}T11:15:00.000Z`).getTime()
        }
    };
};