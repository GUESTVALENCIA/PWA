/**
 * Context Orchestrator - Sistema de Orquestación de Contexto para Sandra
 * Basado en el pipeline de Gemini API recomendado
 * 
 * Este módulo consulta APIs públicas (clima, hora, eventos) y determina
 * el estado de escena (look, ambiente, voz) para Sandra según prioridades:
 * 1. Eventos (Fallas, Navidad, etc.) - PRIORIDAD ABSOLUTA
 * 2. Horario (Mañana/Tarde/Noche)
 * 3. Clima (Soleado/Lluvia/Nublado)
 */

/**
 * Obtener contexto completo del entorno (clima, hora, eventos)
 * @param {string} timezone - Zona horaria (ej: 'Europe/Madrid')
 * @param {string} location - Ubicación (por defecto 'Valencia')
 * @returns {Promise<Object>} Objeto con contexto completo
 */
async function getContext(timezone = 'Europe/Madrid', location = 'Valencia') {
  try {
    // Consultar todas las APIs en paralelo
    const [weather, time, events] = await Promise.allSettled([
      getWeather(location),
      getTime(timezone),
      getEvents(location)
    ]);

    const weatherData = weather.status === 'fulfilled' ? weather.value : null;
    const timeData = time.status === 'fulfilled' ? time.value : null;
    const eventsData = events.status === 'fulfilled' ? events.value : null;

    // Determinar estado de escena según prioridades
    const sceneState = determineSceneState(weatherData, timeData, eventsData);

    return {
      weather: weatherData,
      time: timeData,
      events: eventsData,
      scene: sceneState,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[ContextOrchestrator] Error obteniendo contexto:', error);
    // Retornar estado por defecto en caso de error
    return {
      weather: null,
      time: { hour: new Date().getHours(), period: 'day' },
      events: null,
      scene: {
        id: 'default_day',
        look: 'professional',
        voice: 'calm',
        video: 'sandra_default.mp4'
        // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Consultar clima desde API pública (Open-Meteo - sin registro)
 * @param {string} location - Ubicación
 * @returns {Promise<Object>} Datos del clima
 */
async function getWeather(location = 'Valencia') {
  try {
    // Open-Meteo API (gratuita, sin registro)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=39.4699&longitude=-0.3763&current=temperature_2m,weather_code,is_day&timezone=Europe/Madrid`
    );
    
    if (!response.ok) throw new Error('Weather API error');
    
    const data = await response.json();
    const current = data.current;
    
    // Mapear códigos de clima de WMO
    const weatherCode = current.weather_code;
    const isRaining = [61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode);
    const isCloudy = [1, 2, 3].includes(weatherCode);
    const isClear = weatherCode === 0;
    
    return {
      temperature: current.temperature_2m,
      condition: isRaining ? 'rain' : (isCloudy ? 'cloudy' : 'clear'),
      isRaining,
      isDay: current.is_day === 1,
      code: weatherCode
    };
  } catch (error) {
    console.warn('[ContextOrchestrator] Error consultando clima:', error);
    return null;
  }
}

/**
 * Obtener hora actual y período del día
 * @param {string} timezone - Zona horaria
 * @returns {Promise<Object>} Datos de tiempo
 */
async function getTime(timezone = 'Europe/Madrid') {
  try {
    // WorldTimeAPI (gratuita, sin registro)
    const response = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`);
    
    if (!response.ok) throw new Error('Time API error');
    
    const data = await response.json();
    const hour = new Date(data.datetime).getHours();
    
    // Determinar período del día
    let period = 'day';
    if (hour >= 6 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 18) period = 'afternoon';
    else if (hour >= 18 && hour < 22) period = 'evening';
    else period = 'night';
    
    return {
      hour,
      period,
      timezone: data.timezone,
      datetime: data.datetime
    };
  } catch (error) {
    console.warn('[ContextOrchestrator] Error consultando hora:', error);
    // Fallback a hora local
    const hour = new Date().getHours();
    let period = 'day';
    if (hour >= 6 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 18) period = 'afternoon';
    else if (hour >= 18 && hour < 22) period = 'evening';
    else period = 'night';
    
    return { hour, period, timezone, datetime: new Date().toISOString() };
  }
}

/**
 * Consultar eventos y festividades (Nager.Date - gratuita)
 * @param {string} location - Ubicación (país)
 * @returns {Promise<Object>} Eventos activos
 */
async function getEvents(location = 'Valencia') {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const country = 'ES'; // España
    
    // Nager.Date API (gratuita, sin registro)
    const response = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`
    );
    
    if (!response.ok) throw new Error('Events API error');
    
    const holidays = await response.json();
    const todayStr = today.toISOString().split('T')[0];
    
    // Buscar si hoy es festivo
    const todayHoliday = holidays.find(h => h.date === todayStr);
    
    // Eventos especiales de Valencia (hardcoded por ahora, se puede expandir)
    const valenciaEvents = getValenciaEvents(today);
    
    // Combinar festivos nacionales con eventos locales
    const activeEvents = [];
    if (todayHoliday) {
      activeEvents.push({
        name: todayHoliday.name,
        type: 'national_holiday',
        date: todayHoliday.date
      });
    }
    if (valenciaEvents.length > 0) {
      activeEvents.push(...valenciaEvents);
    }
    
    return {
      active: activeEvents,
      isHoliday: !!todayHoliday || valenciaEvents.length > 0,
      nextEvent: getNextEvent(holidays, valenciaEvents, today)
    };
  } catch (error) {
    console.warn('[ContextOrchestrator] Error consultando eventos:', error);
    return { active: [], isHoliday: false, nextEvent: null };
  }
}

/**
 * Obtener eventos específicos de Valencia
 * @param {Date} date - Fecha actual
 * @returns {Array} Lista de eventos activos
 */
function getValenciaEvents(date) {
  const events = [];
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // Fallas de Valencia (15-19 de marzo)
  if (month === 3 && day >= 15 && day <= 19) {
    events.push({
      name: 'Fallas de Valencia',
      type: 'cultural_festival',
      date: `${date.getFullYear()}-03-${day}`,
      priority: 'high',
      language: 'ca', // Valenciano
      look: 'fallera',
      greeting: 'Bon dia! Som les Falles de València!'
    });
  }
  
  // Semana Santa (aproximada, se puede mejorar)
  // Tom Tom (último miércoles de agosto)
  // etc.
  
  return events;
}

/**
 * Obtener próximo evento
 */
function getNextEvent(holidays, localEvents, today) {
  // Lógica para encontrar el próximo evento
  // Por simplicidad, retornamos null
  return null;
}

/**
 * Determinar estado de escena según prioridades:
 * 1. Eventos (PRIORIDAD ABSOLUTA)
 * 2. Horario
 * 3. Clima
 * @param {Object} weather - Datos del clima
 * @param {Object} time - Datos de tiempo
 * @param {Object} events - Datos de eventos
 * @returns {Object} Estado de escena completo
 */
function determineSceneState(weather, time, events) {
  // PRIORIDAD 1: EVENTOS
  if (events && events.active && events.active.length > 0) {
    const mainEvent = events.active[0]; // Tomar el primer evento activo
    
    // Si es Fallas
    if (mainEvent.name && mainEvent.name.includes('Fallas')) {
      const period = time?.period || 'day';
      const weatherFilter = weather?.condition || 'clear';
      
      return {
        id: `fallas_${period}_${weatherFilter}`,
        priority: 'event',
        look: 'fallera',
        voice: 'festive',
        language: 'ca', // Valenciano para Fallas
        video: `sandra_fallera_${period}_${weatherFilter}.mp4`,
        // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
        priceMultiplier: 1.5 // Los precios suben en eventos
      };
    }
    
    // Otros eventos
    return {
      id: `event_${mainEvent.type}_${time?.period || 'day'}`,
      priority: 'event',
      look: 'festive',
      voice: 'enthusiastic',
      video: `sandra_event_${time?.period || 'day'}.mp4`,
      // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
      priceMultiplier: 1.3
    };
  }
  
  // PRIORIDAD 2: HORARIO
  const period = time?.period || 'day';
  const weatherFilter = weather?.condition || 'clear';
  
  // PRIORIDAD 3: CLIMA (como modificador)
  const sceneId = `${period}_${weatherFilter}`;
  
  const sceneConfigs = {
    'morning_clear': {
      look: 'professional',
      voice: 'energetic',
      // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
    },
    'afternoon_clear': {
      look: 'casual',
      voice: 'warm',
      // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
    },
    'evening_clear': {
      look: 'elegant',
      voice: 'calm',
      // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
    },
    'night_clear': {
      look: 'professional_night',
      voice: 'calm',
      // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
    },
    'morning_rain': {
      look: 'professional',
      voice: 'cozy',
      // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
    },
    'afternoon_rain': {
      look: 'casual',
      voice: 'warm',
      // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
    },
    'evening_rain': {
      look: 'elegant',
      voice: 'calm',
      // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
    },
    'night_rain': {
      look: 'professional_night',
      voice: 'calm',
      // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
    }
  };
  
  const config = sceneConfigs[sceneId] || sceneConfigs['day_clear'];
  
  return {
    id: sceneId,
    priority: 'time',
    look: config.look,
    voice: config.voice,
    video: `sandra_${sceneId}.mp4`,
    // 🚀 ELIMINADO: greeting - el saludo se genera automáticamente con generateNaturalGreeting()
    priceMultiplier: 1.0
  };
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getContext,
    getWeather,
    getTime,
    getEvents,
    determineSceneState
  };
}

