import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    type LegendItem
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const AdminDashboard = () => {
    const { user } = useAuth();

    // Sample data for the chart
    type ChartPeriodData = {
        period: string;
        value: number;
    };

    const chartData: ChartPeriodData[] = [
        { period: 'Jan 1-5', value: 24 },
        { period: 'Jan 6-12', value: 28 },
        { period: 'Jan 13-19', value: 30 },
        { period: 'Jan 20-26', value: 38 },
        { period: 'Jan 27-30', value: 20 },
    ];

    const data = {
        labels: chartData.map(d => d.period),
        datasets: [
            {
                label: 'January Signup Trends',
                data: chartData.map(d => d.value),
                backgroundColor: '#ff8800',
                borderColor: '#ff8800',
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 0.8
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: { top: 10, bottom: 10, left: 10, right: 10 }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'center' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'rect',
                    padding: 20,
                    font: { size: 14 },
                    boxWidth: 8,
                    boxHeight: 8,
                    generateLabels: function (): LegendItem[] {
                        return [{
                            text: 'January Signup Trends',
                            fillStyle: '#2EC0E5',
                            strokeStyle: '#2EC0E5',
                            lineWidth: 1,
                            pointStyle: 'rect' as const,
                            hidden: false,
                            index: 0
                        }];
                    }
                }
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleColor: '#f9fafb',
                bodyColor: '#f9fafb',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                border: { display: false, dash: [3, 3] },
                ticks: { stepSize: 8, color: '#6b7280', font: { size: 12 } },
                grid: { color: '#e5e7eb', lineWidth: 1, drawTicks: false, drawOnChartArea: true },
            },
            x: {
                border: { display: true, dash: [3, 3], color: '#b3b3ba' },
                offset: true,
                ticks: { color: '#6b7280', font: { size: 12 } },
                grid: { color: '#e5e7eb', lineWidth: 1, drawTicks: false, drawOnChartArea: true },
            },
        }
    };

    return (
        <div className="admin-dashboard" style={{ backgroundColor: '#ffffff' }}>
            <style>{`
                .admin-dashboard {
                    background-color: #ffffff !important;
                }
                .dashboard-main {
                    background-color: #ffffff !important;
                }
                .dashboard-container {
                    background-color: #ffffff !important;
                }
                @keyframes slideInFromTop {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideInFromBottom {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
            <h1 className="dashboard-welcome">
                Welcome back, <span className="highlight">Admin {user?.name}</span>!
            </h1>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="stat-header">
                        <span className="stat-label" style={{ color: '#000000', fontSize: '1rem' }}>Total Interns</span>
                    </div>
                    <div className="stat-value">124</div>
                    <div className="stat-footer">
                        <span className="stat-trend positive">
                            ↑ +12%
                        </span>
                        <span className="stat-description">vs last month</span>
                    </div>
                </div>
                <div className="stat-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="stat-header">
                        <span className="stat-label" style={{ color: '#000000', fontSize: '1rem' }}>Active Interns</span>
                    </div>
                    <div className="stat-value">94</div>
                    <div className="stat-footer">
                        <span className="stat-description">Currently Active Interns</span>
                    </div>
                </div>
                <div className="stat-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="stat-header">
                        <span className="stat-label" style={{ color: '#000000', fontSize: '1rem' }}>Pending Applications</span>
                    </div>
                    <div className="stat-value">34</div>
                    <div className="stat-footer">
                        <span className="stat-description">Overall Registered Interns</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="dashboard-grid">
                <div className="chart-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="chart-head-container" style={{ backgroundColor: '#f6f6f6', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', marginLeft: '0.5rem' }}>
                        <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
                            <div className="chart-title">
                                <UserPlus className="chart-icon" />
                                <span>New Registers</span>
                            </div>
                            <select className="chart-filter" aria-label="Filter time period" style={{ backgroundColor: '#eeeeee' }}>
                                <option>Last 30 Days</option>
                                <option>Last 60 Days</option>
                                <option>Last 90 Days</option>
                            </select>
                        </div>
                    </div>
                    <div className="chart-content" style={{ height: '300px', backgroundColor: '#ffffff' }}>
                        <Bar data={data} options={options} />
                    </div>
                </div>

                <div className="activity-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="activity-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="activity-content">
                        <div className="activity-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="activity-avatar" style={{ backgroundColor: '#F9F7F4' }}>
                                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                                    <rect width="50" height="50" fill="url(#pattern0_1072_500)" />
                                    <defs>
                                        <pattern id="pattern0_1072_500" patternContentUnits="objectBoundingBox" width="1" height="1">
                                            <use xlinkHref="#image0_1072_500" transform="scale(0.01)" />
                                        </pattern>
                                        <image id="image0_1072_500" width="100" height="100" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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" />
                                    </defs>
                                </svg>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#333', fontWeight: '500' }}><span style={{ fontWeight: '700' }}>John Cruz</span> submitted an application.</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ width: '4px', height: '4px', backgroundColor: '#999', borderRadius: '50%', display: 'inline-block' }}></span>
                                    5 minutes ago
                                </div>
                            </div>
                        </div>
                        <div className="activity-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="activity-avatar" style={{ backgroundColor: '#F9F7F4' }}>
                                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                                    <rect width="50" height="50" fill="url(#pattern0_1072_492)" />
                                    <defs>
                                        <pattern id="pattern0_1072_492" patternContentUnits="objectBoundingBox" width="1" height="1">
                                            <use xlinkHref="#image0_1072_492" transform="scale(0.01)" />
                                        </pattern>
                                        <image id="image0_1072_492" width="100" height="100" preserveAspectRatio="none" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAQAElEQVR4AexcCZgc1XGueq9XkjHHamdGAoJACHOFI+b4QHaMgIAhJkAMBIO5bWOMMbbAYCTC7mzvjABxKBwygU/CGBA3IQ4R30dsnIAgwXbAwcEWVowAB2yBtD1aIYlD2n6vXDW7Pds9M9qdme5ZzYL66zfvqvpfvap3d08r2HK1lAa2GKSlzAGwxSBbDNJiGmgxcVq+h5A7dQK5mU/7XZkvmWy6y3Sn7/ezmZ+ZbOplv6vjNT+bXu13pTcUXTHc8VoxL5t5XmiFx2dewRCsFtN/hTgtZxBywaGu9EGs1Fm2K/2UMev6rKWXEOlhlj4HBGcg0HQA3A9RTUOAiYgwruiKYTWtmAf0GaEFgJzwCoYx69exAV802czcfjd1NH37U+M5v6Vu1QrSsBGUKMh0pu81JtVnEV4EwLmEcDQiToCELkRw2IAHAdAsZfEp097nme7MPf3Z1FEiQ0LFxILZrAah7ok7S2s1Jv3/oiBQcDYibh2rRnUwF8siOkcB/lRkMN2Za4llqgMicVKVOGINgNSZ2d10p35gSC+X1ooIOw3HRmRf55a9GBBuJIALlMLDlTL7KaunqY39Heodb1zRSVjSJI/gCKEVHiR6QjCGK6MoA9FsY/Wr3FPv5DnnU8PRNytvVA1C7qRpprvjQaPot0D4VVZyW7WKsSLfAqS7CegcpewUJ796N5XzTtQ93vecnLcQ3d5n0e37Dc5Z+QbOfbcPF0B/0UlY0iQv7y0RWuFR+cIJRQzGIqJzweI9RPCHamWzYcZxT/2asbTMdKfvp87Ju1aja1ZacwxSJi1dAG08NM001rwMpE5nQ+gyEmAFrQULi6yiz+uct4vuKXzFyRUWobu6quLK+WuJC5aTL9yr5/Se5+S9KYrgYDb8rQRYKOcvysgLCKP8pSabdmmUFgBNN0i/23GMv31qKQDdjICfLK+4JXhFWq1eP2F7Pcc7p80t/BSZuJyuGXHMe79kw8/U68ZPERlElvJyEPATnNbtt/e93M8rMw439W6aQYiXr9Ky0KgnFeDulbWw/ytKcJZ5+zvcavGmP3xQSTM6KVK2yODkvX0J4ER2/11eskLcAy3+xHSnbiEXxpXnJxVXSQGFccjdfqqx6f/itG4ekyNl8NC0ggBP17nVn3bEEI+CYbqWuJF7ppPzFrM7lADOEFnDgnE+b4HwO8ZmltBV7buE85IKR5SVBKifzXzBGP8lFv6QMB5Xzuf4TXoD7OXkemWTx9HWvdkoD2pt9+ZV2s2DspeEZatMN9p5qT876dhSYkKBRA3id6XO4Ub2OPeK9rB8FuhVreFQnqy/i9d768J5rRzmRcBa3eNdyiuQ6Ty88hJ9SFpucBMR7GKu81lDqfFDiRnEZNOXAeLdCBBdylp42FF0MLre/8QXl83N4zd1pQ83XZlO05m52892LPGz6TfZrWb3up/lc67u9O1+Nn0mXZHeJokyi5O/poO4bo+G8TjexnW+l+t+aTg9TljFYQ54+dxpDodvZAH55hDfA92cLuKV0+nS0jip4Zt4geBnM6fartRiPlop8NHKM4CUB0XnIqgZXOgUdtxiYVcEPuciuJDj95kJtNJkM9+nK7fPQMxL6qBy3pe4SVxMBDL8FhG5HL7hH3iyzxcTYv7ENoiRngF4VVgO7t7vg4aTdK5wezi93jDx2t90pS83Ns07dXqEEI/HOo5WsLhkpW+Ztv63/IFe9ILhjanflT6fruqYUq88Qq9zhdsA4WTetH4g8ZIj7DTZdOyeEssgPs8ZBHBDSSgOcLxPgz7Gcb0nONrwTV2Zw/z2Nb/iyt+AAA0pLygcAccjY7A7uLgxRVhotHqDd+KLqDO9Z0BXq88T/mJN+vNS1zAPx+f5XalYc4oKA9YT9nk1BYh3ciX5HuBkgfq0UkdgfpUseQcS6/xlDOSW5hqkJQphrxB7okEWWgPBWQbhZS7vG/WCSx2lrixvX8DLmMg6uSvO6ksFYPX4xPsMPut4AGFoApdhSpM6Ad1VL9eDFaaVIxbbmfkhp3UzNt8cavKNWNzk3WG6M/NZuXWVKXWVOoeHLwZoQ7IPNLpPUfXWl1wYZ6z/MFektLQtTnIaT5NWUy9emN5OyiwEnqjDaaMWJrrYZtPZessbqDOeVtTBIDPrpsPotoekgQ0m1ezVbRBr03O5FUQ2fYj0nbhzhsmmrtxsxhhUFys1y8fuMwajNXsypyBQZELn+HS7Q/qamkEGCesySH+2QyaySwZ5BzzeZ/DKI95qyp30WSKcMwC4+X65ZSvr25sIgNsc1HXpfOH7SPRPYSYiuKw/mzoqnDZSuGaDEC9BAdR8hCFhed5Yrhx7AcS4iIdAa+0CUUYMmORYFR5o3NTfNgKIG/Crluh3Ae+grm4f0F2QOrxfs0Fs+5pZTFxaIrL1fS3zhrt67fBFDJ9rbfrbTLEPu5a50UK2EWHkWMgBOIsASgemCnB32/7uZbXiqVoIZcXAK4lZYVpUcCvGPA6RlsOG/W4YtzXCeAB1pvZuRBbMF15ApNvCvIS2k2p88liTQayj5iLiVkEhrMQV6gNwIeZlJ645DxF2jAnTFHaL6qRGgdWHNsvD+TsBPwJ+wmqTC+LD+SMahNz0HkTq1AgIYiKntty1z4/gtlCEkL7YqDh4Xd+7gHh5mJ8snE6dk3YLp1ULj2gQ69NsBD6ZKnHTSzrX+0gp2mBAhgQEfqbdIH9ibJsGOpDcHUujwqbJqufwUvh+sFQ64eaRwLHgz6pOPZQ6rEGoe+LOpDByNkMK5rAiaQiisZBFjPa6xmCaxsV11GA27BenAFJqbpifUJ070qHmsAax5FzEgrUFoJbgFQ2FfwnicXxCOCYO/2jwWsAD4pSjVe9jrLNlAQYijLNafzOIV/NVtURJIxcUT0xnSjhwCHQdumCDeKM+uR3bMm9kt8/x1ruR/jyOUKIrBLwujCE6JdZtOC0c3qRBfNtxFFu09EYhr6zWaj0+shMNA9UT9gEPQRg6mKyHdzRpkdSfxS1Prx//MAG8G+CwTnf2IXVEEC/3VXlCEFdWnR2ExUcFj6C74n0Jx3XKwIFxMUaD3yawJJdXjHhf8qOwvIogottIXjgShImPM3jZF1mHK8RFQX5sX+FfxMYYFQCK3UNETDZsRHdk8eRNnQRX7yEmcygibi1g4gjgLXB7n5NwEo6Hvz2SwGk+BnUkUYYDhWe4zisCLETYFiZPqjqHVjWIRYqcUKKlpF/vHHGDFAi/eX3cioaZgGuVDV1glcK/h+kt0JHheBCuahACikw6pODpgCGuT257OwJMjIszGvwsJ8L76Yr3kRspmxD/I8zH88pfheNBuMIgdOlO8nLx9IBAfK0oMYOA35YRzDHjtsJGDFJRPa38iEH4mP4z5E6dUE5YYRDYbsOeCDg+ICT5s4yb3F8CAE06wB4Tfr/VSciJPX1vEtHvAyxE+ave+xVzaYVBjIXSMw9hVqiWip+UM1qNrR6SVMUZRwG9wl7pNkAjG4QfQ0YMQgj/V0JIImBwbPWQJOo8iEGoIrrEssYvZBU9BAgiViObrEEQKSUFfxwdEZTOtYr1txRp/JJWYRBStKtkBI4H0FeDcEJ+IpNkQrKMDNNGODJRbRSMFNElr14juhaUCoOgVXLwJ3mDznqDgWQ8BFnFJYM1Gij9SEkV4yhVCGPxkFWma4AKg3APib7Cb+36MEjsMNHYMkjsCocAfFwXigH3kKiuObPCIABDRyYglzXJGsRSxdpbivlYOPP+2kg9CWowCFGUaPy6iFUjgA1F1NgySBsmNmTB+snRxo1lumZ9VukhnNrEm1dZY2vI2qhK71jFVktqedS4hFiOWc0gJSsOEG9bOvUdiMf+HVs9hFTsJ6QljW3YJjr6YHROEbqRDdKvoiDCFcvJkUEsgLHLPP6TZbqkssYPVVZZAFGiNiwDiacPPodu+NWaeCU3yD1+Y+lcr0GEITZDEV2iraGHIGLp+W8RyehEd9ZE2F7EHSs/vpOYQXw0kWMjUhTVNeukYsjiSfc1Ti/dBqNHKaWMBgMI1NEg62ZiM+OSKpifpUeOSriHRP77LuVUGITPsn4nGYFDiJ7+BukN+zg2Hk6V6udU7hVKefUGsKxxK4gcpQickp+w43VZxGpskMhhY5i23jC5me0Rhp611Mu/OeiN1bH+ARyWGclGeghRDQbRCiJHxLzm2zcMGifsg00MK44c9fAi2J3roR+O1qKK/A9Ga4iMRsJb0UMAvN/wM/UPJFMcAuwq7/hKOK5TFmO9Kxu3/Ib4ERP51B+5209lXZa+IMQ6fg9W9FY8/KswCLqwURH+LCy8sSry0kM4r54wgW34Ff96ykmSlqw9ji6I/5alsSbylonoGBdAf7msqjxB4oTwrPiBQwURsCC9Ht/Pps9EUDMAYExdiDjVTk5fGVdotBTRIQEuqYZZ1SAWogYhi0eTC1Vpq4FWTSO4vmr6GEgkhOg/j6G+i04FzXuOo8NcrMzaDeL0tT/PK4A1AQAi7OTb9OFBvEF/bJ1hhSpJQLEe0vn7pI5EwB0CSAIswMrenwfxsM+GCkcHwjh/+QY+dH5sIDbwqyydPRBq7BcVPtQY5+bnQoCr40ihfBX50xNvvh+rNn9IGVUNIhnWoYgCCfGUwZfoJLtup9BcyS2jaquoG2yUGHiU2Mgb5UudXOGeRoskd8eteLg6OcxvCSK6Dedt0iDO0sLTRDT0T1KEbc3WG74cZq4njO7qtfqdXvlsRZ6HgA318G4OWu4VT2qC/XXeuzlO+cb2f5mxSoeKbOQVjvKqzh9SziYNgo+CQVTyZR6hKzpCuoJiTO7STXXOy2pfy3rcJYA3isAt8sPy9AHgbYr0/irnHYdzvMgmGeq8ipM52MgfPXm4+iG6wOum6mCbNIiQK5/mh1szE+9pbOYUyYvj8JpVK9kwPU7OmyaVB6DZKN9nl8kuDnCdvNxafQJ4gdlusLy018qbpHO9F2N+5a85LfZt9kqfqgBL3ywmog+Vr+cPB6yGy8RrvLfR4n1hGgTLcwFgOC1OWCqvc4XrVL5wAisjo5TajQCPY8zLwdqFBPY5VpzH8Vi3YLB7hkFuB6JvKYIj9Ae6nRvFITrnXdHmes+gO/QtRaaLdRMAdwaI7F94YXOvNEYY5hrWIMKngOYxON8SE4cHmK5UrBWXoFRzyF0F3VWvO7neJ1lJ8/Sc1Rc4udUzAOHvq9HXl4bfc/LekYx7kc4X/hHz3hK8ceV79WHUTm2ymfN457Z/wMGNwSqEeUF8U/6IBsE5hd/yPuT+CADC9TRr4naRtCZE5MjCdKWzQHDHSPAj59NCxrqQWxaOTBuPgmZvNxHIzg2joKJ70fUqDhPDNBIe0SBFIp9mE1CpNSHgZDtB5SSvGU6U5mfTJ/iT0/IRzB5uEDXJOZwsjOFwT7vdZFNPy1ckhqONm2fHjcsj4qQAh+uzTvVjTb28pori1YU/IqmIxfk45SJyOyJ/7AkEkwhnxgAABTRJREFUaNQnN7O1fMLVZjvkU+X/yl081v/Eq8nBjelwXj7+ynR2LCA3lfhHNkk+xgZ0YbhsBLpW5uNw2qbCNRlEmNX68TKXvCFhcYjgGIMPktveLvE4jhVziCjIWFrBuAsBVFP/pctljAOlvs7yL7VdqcXcG/+GXHDi1EF4Zagyxj6IAFri4nhkeU2pbW6ScC2uZoPI/6014bkEYAJg5JNQsvrOIF6PT+7EfU13Ku93pV61Fn8hCkKA0gaqHqxGaRFB8QnE8VzuE8ak/sjD2c3UnfkcNWAcAkBqa7uLMUsPtDjNaNLnovv7D6HGq2aDCB7me59DwMipLQGeYrKZmZI/nCPuSb6bOtl0y3fZU8ut1b8Gwk5ETOQB0HBl15LHcvCYjzMt0XPGpj2bzfyz6UpdTNxwCHj2geEv25W+lBAiz3t43Xst1vkN47oMAnwp1etC6LNDnATcLef52UkVG0bqTO9pujKdvnwg3zoe72keY+IL2agt/bdoBNiO63QSIM6XhmOymV7TmX6I57czZFiSOoed72b+jiq/8P2CeruQC9PVEq7bIOjCRuUo+U6tFxSAwGMmmfuoK3MYC4bcE75oOlO/tAqWcUfOI9B0BKYJGMaYz/KneE9xGiLcb9raVlmed/rdjuLXjMjNzABjF3FeSZdszF5t9WlY5YngSFUvgYxEGM5Ht3e5BpQP0pcOCRFxgkF63GTTP+ee8CNQOCa+ZxKuVy1hRHAI8Xhl1Y/9bMezxtDjyHUPeNkYG3jeOAnnrCwtgIK8WvyGDCLAyPMJgJJJnjuFpAAgwER2VT8ZAR/BC0EdhgilVSYrgm/4OtY5b0DoatgggsFHHA8jUU0bHqEfe64+iXlou9LJFRbVxxWljmUQgeJzobnsX87u430TXqX5kDSuEmIbRATQOW8er56+yf2Vb0n5+DiuMN94ic73XgMJXIkYROTQee8OIDyfTzU3Svzj4GQC5wPqr/Bjg1uSqm9iBhGBnHzvXVqrI/lBzDsS/yg7NkavJjyW54yGn7dX00+iBpEC0F31vLZ0SPnmUfI+Ko7HqBe1ogPlmUrSdUrcICIgXr36LbWqICfBPSy8kbSPguPh2AfA63Rf++cwyS8kwdDVFIMIvOxSebJ3NdFfWuIduySOYcd1eEUDfZbni9k4f3lpQ5x0lZpmkEBQzBd+4ayfILt27i30XpA+VnyeD9ezrFlHb30Q10VeiOBo8+6mG0RELx7d5zxXq/FT+Wzr1oGuLzmt64oyIizQWu3OPT1fzxF6nFqNikECAdFd4emewkwexvZnw9zFra/m5wQBRrP9okwWfqAJ9tU93jfQ7U18xThcHUbVIIEg8uKE7il8TWuzAwBewq3xTdjMFy9j32YRerQeP0XP8c7HmC/JMVZD92YxSCApumvW8CR5i17mTVOIh3GvkeGs9H3bgK5ZPjcEDyws4pXgifqdwi48NLnSi5tVXi24m9UggYDF11Z7ev+Te81Mrb0pinAG5/Ug0I9ZWe9yOJGbDbAGCf6NwVxpAFzWZO4N5zg5bzEugIp/MzHdqN8tYZBwrdEFi3y0L61V5Qp/rZXXocjuy8o8k49mrgJrFyLgU7wMXSbDDAH0sTODjsP0tuQh4U+EVniEVym7DxsgpfLeF3TO60FuAOiCDZfdCuGWM0i5UkRpmF+91Ml7D2g+wJO3GVWu95i2vLe3kyvs6OS8DnbOoONwYUfJU/neY4VWeISXN3KvCFY5fqvFW94graawZsuzxSDN1nCd+FsMUqfCmk3+JwAAAP//DfMr0wAAAAZJREFUAwANXNAyaEHw+AAAAABJRU5ErkJggg==" />
                                    </defs>
                                </svg>

                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#333', fontWeight: '500' }}><span style={{ fontWeight: '700' }}>Maria Santos</span> was approved.</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ width: '4px', height: '4px', backgroundColor: '#999', borderRadius: '50%', display: 'inline-block' }}></span>
                                    20 minutes ago
                                </div>
                            </div>
                        </div>
                        <div className="activity-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="activity-avatar" style={{ backgroundColor: '#F9F7F4' }}>
                                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                                    <rect width="50" height="50" fill="url(#pattern0_1072_500)" />
                                    <defs>
                                        <pattern id="pattern0_1072_500" patternContentUnits="objectBoundingBox" width="1" height="1">
                                            <use xlinkHref="#image0_1072_500" transform="scale(0.01)" />
                                        </pattern>
                                        <image id="image0_1072_500" width="100" height="100" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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" />
                                    </defs>
                                </svg>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#333', fontWeight: '500' }}><span style={{ fontWeight: '700' }}>Kenneth Sanchez</span> was approved.</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ width: '4px', height: '4px', backgroundColor: '#999', borderRadius: '50%', display: 'inline-block' }}></span>
                                    1 hour ago
                                </div>
                            </div>
                        </div>
                        <div className="activity-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="activity-avatar" style={{ backgroundColor: '#F9F7F4' }}>
                                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                                    <rect width="50" height="50" fill="url(#pattern0_1072_503)" />
                                    <defs>
                                        <pattern id="pattern0_1072_503" patternContentUnits="objectBoundingBox" width="1" height="1">
                                            <use xlinkHref="#image0_1072_503" transform="scale(0.01)" />
                                        </pattern>
                                        <image id="image0_1072_503" width="100" height="100" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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" />
                                    </defs>
                                </svg>

                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#333', fontWeight: '500' }}><span style={{ fontWeight: '700' }}>New Announcement</span> posted.</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ width: '4px', height: '4px', backgroundColor: '#999', borderRadius: '50%', display: 'inline-block' }}></span>
                                    3 hours ago
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
