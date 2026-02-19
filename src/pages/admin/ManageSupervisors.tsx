import { ChevronDown, Menu, Plus, Search } from 'lucide-react';

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
        </div>
    );
};

export default ManageSupervisors;
