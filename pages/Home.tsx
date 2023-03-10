
import { Button, Table } from 'react-bootstrap'
import TradingViewChart from '../components/TradingViewChart/TradingViewChartWrapper'
import TradingViewChartLight from '../components/TradingViewChartLight/TradingViewChartLightWrapper'
import { useEffect, useState } from 'react'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { PumpData } from './api/PumpData.json';
import { supabase } from "../utils/supabase";




//Pausing function
export default function Home({ }) {

  //-------------- Identifier Chart Setup
  const [identifierChartData, setIdentifierChartData] = useState([])
  async function getSymbolData(symbol, time) {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&startTime=${time - (60000 * 20)}&endTime=${time + (60000 * 20)}`)
    const orders = await res.json()
    let propperArray: Array<Object> = []
    orders.forEach(row => {
      propperArray.push({
        Symbol: symbol,
        Open_Time: row[0],
        Open: row[1],
        High: row[2],
        Low: row[3],
        Close: row[4],
        Volume: row[5],
        Close_Time: row[6],
        Quote_Asset_Volume: row[7],
        Number_Of_Trades: row[8],
        Taker_Buy_Base_Asset_Volume: row[9],
        Taker_Buy_Quote_Asset_Volume: row[10],
        Ignore: row[11]
      })
    });
    setIdentifierChartData(propperArray)
  }
  //Initial symbol data
  useEffect(() => {
    getSymbolData(PumpData[0].Symbol, PumpData[0].Open_Time)
  }, [])

  const [pumpData, setPumpData] = useState({})
  async function getPumpData() {
    //Recieving the most recent APR value we have...
    let pumpDataRetrieved = await supabase
      .from('Probabilities')
      .select()
      .order('id', { ascending: false }) //ordering from highest timestamp to smallest.
      .limit(1) //limiting to 1 to only get one out.
    setPumpData(pumpDataRetrieved.data[0])
  }
  useEffect(() => {
    getPumpData()
  }, [])

  supabase
    .channel('public:Probabilities')
    .on('postgres_changes', { event: '*', schema: 'public' }, (data: any) => {
      console.log(data.new)
      setPumpData(data.new)
    })
    .subscribe()

  console.log(pumpData)

  //Width and span of the input option for eth invested. 
  const popover = (
    <Popover style={{ boxShadow: '0 0 1.25rem rgb(31 45 61 / 25%)' }} id="popover-basic">
      <Popover.Header as="p">How are pumps predicted?</Popover.Header>
      <Popover.Body as='p' style={{ fontSize: '11.5px' }}>
        {'This is how'}
      </Popover.Body>
    </Popover>
  );

  return (
    <>
      <div className='row'>
        <div className='col-4'>
          <div className="container" style={{ margin: '0px', maxWidth: '100%', background: 'rgba(255,0,00,0.2)', paddingTop: '12px', borderRadius: '10px', marginBottom: '15px' }}>
            <h3 className="card-title" style={{ marginBottom: '15px' }}>
              Anomaly Detection
              <Button disabled variant='success' style={{ marginLeft: '10px' }}>
                Live
              </Button>
            </h3>
            <div className='row'>
              <div className='col'>
                <div className='card'>
                  <TradingViewChartLight
                    title={'Identified Pump'} data={identifierChartData} wrt={'Close'} />
                  <div style={{ height: '245px', overflowX: 'scroll', padding: '5px' }}>
                    <Table hover>
                      <thead style={{ position: 'sticky', top: 0 }}>
                        <tr style={{ background: 'white' }}>
                          <th>Pair</th>
                          <th>Time</th>
                          <th>Volume</th>
                          <th>Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PumpData.map((row) => {
                          var date = (new Date(row.Open_Time)).toString()
                          return (
                            <tr style={{ cursor: 'pointer' }} onClick={() => { getSymbolData(row.Symbol, row.Open_Time) }}>
                              <td>{row.Symbol.slice(0, -3)}</td>
                              <td>{date.slice(0, -34)}</td>
                              <td>{row.BTC_Volume.toFixed(3)} BTC</td>
                              <td>{(100 * (row.High - row.Open) / row.Open).toFixed(2)}%</td>
                            </tr>
                          )
                        })}
                      </tbody>range
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='col-8'>
          <div className="container" style={{ margin: '0px', maxWidth: '100%', background: 'rgba(0,0,256,0.15)', paddingTop: '12px', borderRadius: '10px', marginBottom: '15px' }}>
            <h3 className="card-title" style={{ marginBottom: '15px' }}>
              <div className='row'>
                <div className='col-4'>
                  Pump Predictor
                  <OverlayTrigger trigger="click" placement="bottom" overlay={popover}>
                    <Button style={{ padding: '0px 10px', border: '0px', marginLeft: '5px' }} variant="info">i</Button>
                  </OverlayTrigger>
                  <Button disabled variant='success' style={{ marginLeft: '10px' }}>
                    Live
                  </Button>
                </div>
                <div className='col-4'>
                  <div className='card' style={{textAlign: 'center', margin: '0px'}}>
                  <p style={{padding: '0px', margin: '0px', fontSize: '18px'}}>Time: {pumpData.Time}</p>

                  </div>
                </div>
              </div>
            </h3>
            <div className="row">
              <div className='col-6'>
                <TradingViewChart symbol={pumpData.Coin_1} confidence={pumpData.Coin_1_Prob} />
              </div>
              <div className='col-6'>
                <TradingViewChart symbol={pumpData.Coin_2} confidence={pumpData.Coin_2_Prob} />
              </div>
            </div>
            <div className="row">
              <div className='col-6'>
                <TradingViewChart symbol={pumpData.Coin_3} confidence={pumpData.Coin_3_Prob} />
              </div>
              <div className='col-6'>
                <TradingViewChart symbol={pumpData.Coin_4} confidence={pumpData.Coin_4_Prob} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

