import { getMetaData, cachedResponse, validateSearchQuery, getData, findValue, shortMonthToNum } from './helpers.js';

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function handler(request) {
  const url = new URL(request.url);
  const { lng, lat } = validateSearchQuery(url);

  const wms = 'https://opendata-view.smhi.se/klim-stat_solskenstid/wms';
  const responses = await Promise.all([
    'solskenstid',
    'solskenstid_feb',
    'solskenstid_apr',
    'solskenstid_jun',
    'solskenstid_aug',
    'solskenstid_okt',
    'solskenstid_dec'
  ].map(layer => getData([lng, lat], {
    wms,
    layers: [layer]
  })));

  const cleanValue = v => v.includes(' ') ? v.split(' ')[0] : v;

  const data = responses.reduce((acc, curr, i) => ({
    ...acc,
    value: {
      ...acc.value,
      [i === 0 ? 'year' : '--' + shortMonthToNum(curr.legendGraphic.Legend[0].layerName.split('_')[1])]: cleanValue(findValue(curr))
    }
  }), { unit: 'timmar', value: {} });

  data.metadata = await getMetaData(wms);

  return cachedResponse(data, request);
}
