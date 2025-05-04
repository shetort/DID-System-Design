
import { getLog } from '../../../services/LogService';
import { useEffect, useState } from 'react';
import './Log.css'

interface LogData {
    senderAddress: string;
}

interface LogItem {
    contractAddress: string;
    from: string;
    method: string;
    status: 'success' | 'failed';
    timeStamp: string;
    txHash?: string;
    blockHash?: string;
    blockNumber?: number;
    gasUsed?: string;
    error?: string;
}

export default function Log({ senderAddress }: LogData) {
    console.log("VCVIew senderAddress:", senderAddress);
    const [logs, setLogs] = useState<LogItem[]>([]);

    useEffect(() => {
        // 请求数据
        getLogs();
    }, []);

    const getLogs = async () => {
        try {
            const loggers = await getLog();
            setLogs(loggers.logs);
            console.log("GET LOGS:", loggers);
        } catch (error) {
            throw new Error("GET LOG FAILED")
        }
    };


    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };



    return (
        <div className="did-container">
            <h2 className="section-title">合约运行日志</h2>

            <div className="logs-container">
                <div className="logs-scroll-wrapper">
                    {logs.length === 0 ? (
                        <div className="no-logs">暂无日志记录</div>
                    ) : (
                        [...logs].reverse().map((log, index) => (
                            <div key={index} className="log-item">
                                <div className="log-header">
                                    <span className={`status-badge ${log.status}`}>
                                        {log.status === 'success' ? '成功' : '失败'}
                                    </span>
                                    <span className="timestamp">{formatDate(log.timeStamp)}</span>
                                </div>

                                <div className="log-content">
                                    {/* 公共字段 */}
                                    <div className="log-row">
                                        <span className="log-label">合约地址：</span>
                                        <span className="log-value monospace">{log.contractAddress}</span>
                                    </div>
                                    <div className="log-row">
                                        <span className="log-label">调用方法：</span>
                                        <span className="log-value">{log.method}</span>
                                    </div>
                                    <div className="log-row">
                                        <span className="log-label">调用地址：</span>
                                        <span className="log-value monospace">{log.from}</span>
                                    </div>

                                    {/* 成功时的专属字段 */}
                                    {log.status === 'success' && (
                                        <>
                                            <div className="log-row">
                                                <span className="log-label">交易哈希：</span>
                                                <span className="log-value monospace">{log.txHash}</span>
                                            </div>
                                            <div className="log-row">
                                                <span className="log-label">区块高度：</span>
                                                <span className="log-value">{log.blockNumber}</span>
                                            </div>
                                            <div className="log-row">
                                                <span className="log-label">Gas消耗：</span>
                                                <span className="log-value">{log.gasUsed}</span>
                                            </div>
                                        </>
                                    )}

                                    {/* 错误信息 */}
                                    {log.error && (
                                        <div className="log-row">
                                            <span className="log-label">错误信息：</span>
                                            <span className="log-value error-message">{log.error}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
