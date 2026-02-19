import { Archive, ChevronDown, Menu, Pencil, Plus, Search } from 'lucide-react';

const ManageSupervisors = () => {
    return (
        <div className="container" style={{ maxWidth: '100%', padding: '0' }}>
            {/* Header Section */}
            <div className="row row-between" style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'hsl(var(--orange))', fontSize: '2rem', margin: 0 }}>Manage Supervisors</h1>
                <button className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Plus size={18} />
                    Add Supervisor
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '5rem' }}>
                <div style={{
                    background: '#F9F7F4',
                    borderRadius: '20px',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    padding: '1.5rem',
                    textAlign: 'center',
                    width: '350px'
                }}>
                    <div style={{ fontSize: '1.375rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem' }}>Total Supervisors</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '600', color: '#2b2a2a' }}>0</div>
                </div>
                <div style={{
                    background: '#F9F7F4',
                    borderRadius: '20px',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    padding: '1.5rem',
                    textAlign: 'center',
                    width: '350px'
                }}>
                    <div style={{ fontSize: '1.375rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem' }}>Active Supervisors</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '600', color: '#2b2a2a' }}>0</div>
                </div>
                <div style={{
                    background: '#F9F7F4',
                    borderRadius: '20px',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    padding: '1.5rem',
                    textAlign: 'center',
                    width: '350px'
                }}>
                    <div style={{ fontSize: '1.375rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem' }}>Archived Supervisors</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '600', color: '#2b2a2a' }}>0</div>
                </div>
            </div>

            {/* Search and Filter */}
            <div style={{
                marginBottom: '2rem',
                marginLeft: '0',
                marginRight: '0',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                background: '#F9F7F4',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #777777',
            }}>

                {/* Search Bar */}
                <div style={{
                    position: 'relative',
                    flex: '1',
                    minWidth: '200px',
                    border: '1px solid #777777',
                    borderRadius: '8px'
                }}>
                    <Search
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#666'
                        }}
                    />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name or email"
                        style={{
                            paddingLeft: '3rem',
                            width: '100%',
                            height: '40px',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Filters Label */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginRight: '1rem'
                }}>
                    <Menu size={16} style={{ color: '#666' }} />
                    <span style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#000000'
                    }}>Filters:</span>
                </div>

                {/* Date Created Filter */}
                <div style={{
                    position: 'relative',
                    minWidth: '220px',
                    border: '1px solid #777777',
                    borderRadius: '8px'
                }}>
                    <select
                        className="select"
                        style={{
                            paddingRight: '2.5rem',
                            height: '40px',
                            width: '100%',
                            outline: 'none'
                        }}
                    >
                        <option value="all">All Date Created</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                    <ChevronDown
                        size={16}
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none'
                        }}
                    />
                </div>

                {/* Status Filter */}
                <div style={{
                    position: 'relative',
                    minWidth: '180px',
                    border: '1px solid #777777',
                    borderRadius: '8px'
                }}>
                    <select
                        className="select"
                        style={{
                            paddingRight: '2.5rem',
                            height: '40px',
                            width: '100%',
                            outline: 'none'
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                    <ChevronDown
                        size={16}
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Supervisor Table */}
            <div style={{
                marginLeft: '0',
                marginRight: '0',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#ff9800', color: 'white' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'left' }}>Email Address</th>
                            <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'left' }}>Date Created</th>
                            <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '1rem', color: '#2b2a2a' }}>Carl Lee</td>
                            <td style={{ padding: '1rem', color: '#2b2a2a' }}>carllee1998@gmail.com</td>
                            <td style={{ padding: '1rem', color: '#2b2a2a' }}>01/01/2016</td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{ color: '#5D46E0', fontWeight: 500 }}>Archived</span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2b2a2a', padding: '4px' }} title="Edit">
                                        <Pencil size={18} />
                                    </button>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2b2a2a', padding: '4px' }} title="Archive">
                                        <Archive size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '1rem', color: '#2b2a2a' }}>Faye Ortega</td>
                            <td style={{ padding: '1rem', color: '#2b2a2a' }}>fayeortega@gmail.com</td>
                            <td style={{ padding: '1rem', color: '#2b2a2a' }}>01/03/2016</td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{ color: '#16a34a', fontWeight: 500 }}>Active</span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2b2a2a', padding: '4px' }} title="Edit">
                                        <Pencil size={18} />
                                    </button>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2b2a2a', padding: '4px' }} title="Archive">
                                        <Archive size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageSupervisors;
