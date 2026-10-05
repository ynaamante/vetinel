import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Topbar from '../components/Topbar';
import StatusIndicator from '../components/StatusIndicator';
import { Icons } from '../icons';
import { canViewFeature } from '../utils/permissionUtils';

const CATEGORY_COLORS = {
  Consultation: ['#d8f4e8', '#087f65', '#139b76'],
  Vaccination: ['#f3e8ff', '#9333ea', '#8b5cf6'],
  Surgery: ['#fee2e2', '#dc2626', '#ef4444'],
  Dental: ['#ccfbf1', '#0f766e', '#14b8a6'],
  Grooming: ['#fce7f3', '#db2777', '#ec4899'],
  Laboratory: ['#fef3c7', '#b45309', '#f59e0b'],
  Confinement: ['#e0e7ff', '#087f65', '#6366f1'],
  General: ['#f1f5f9', '#475569', '#64748b'],
};

const INITIAL_SERVICES = [
  ['General Consultation', 'Consultation', 500, '30 min', 1, 78, 'Available', 'Routine physical examination, diagnosis, and treatment'],
  ['Rabies Vaccination', 'Vaccination', 350, '15 min', 3, 52, 'Available', 'Annual anti-rabies vaccination for dogs and cats'],
  ['DHPP Vaccination (Dogs)', 'Vaccination', 380, '15 min', 2, 41, 'Available', 'Combination vaccine protecting against Distemper'],
  ['FVRCP Vaccination (Cats)', 'Vaccination', 360, '15 min', 2, 28, 'Available', 'Core feline vaccine against viral Rhinotracheitis'],
  ['Complete Vaccination Package', 'Vaccination', 1200, '30 min', 3, 18, 'Available', 'Full puppy/kitten vaccination series package'],
  ['Deworming Treatment', 'General', 350, '20 min', 2, 35, 'Available', 'Oral antiparasitic treatment for intestinal worms'],
  ['Spay Surgery (Female)', 'Surgery', 3500, '2h', 4, 8, 'Available', 'Elective ovariohysterectomy for female dogs and cats'],
  ['Neuter Surgery (Male)', 'Surgery', 2800, '1h 30m', 4, 11, 'Available', 'Elective castration for male dogs and cats'],
  ['Dental Cleaning & Polishing', 'Dental', 1500, '1h', 2, 12, 'Available', 'Professional dental scaling and polishing'],
  ['Full Grooming (Small Breed)', 'Grooming', 500, '1h 30m', 1, 24, 'Available', 'Bath, blow dry, haircut, nail trim, ear cleaning'],
  ['Full Grooming (Large Breed)', 'Grooming', 800, '2h', 1, 15, 'Available', 'Complete grooming service for large breeds'],
  ['CBC (Complete Blood Count)', 'Laboratory', 800, '30 min', 2, 20, 'Available', 'Full blood count laboratory test to assess overall health'],
  ['Urinalysis', 'Laboratory', 600, '30 min', 1, 14, 'Available', 'Comprehensive urine analysis for kidney health'],
  ['X-Ray (Digital)', 'Laboratory', 1200, '20 min', 0, 9, 'Available', 'Digital radiography for orthopedic and thoracic assessment'],
  ['Confinement (per day)', 'Confinement', 800, 'Per day', 0, 6, 'Available', 'In-patient ward care including monitoring and feeding'],
  ['IV Fluid Therapy (per day)', 'Confinement', 1200, 'Per day', 1, 5, 'Available', 'Intravenous fluid administration for hydration'],
  ['Wound Care & Dressing', 'General', 400, '30 min', 2, 16, 'Available', 'Wound assessment, cleaning, disinfection, and dressing'],
  ['Emergency Consultation', 'Consultation', 1000, '45 min', 1, 2, 'Unavailable', 'After-hours or urgent veterinary consultation'],
].map((row, index) => ({
  id: `SRV-${String(index + 1).padStart(3, '0')}`,
  name: row[0],
  category: row[1],
  price: row[2],
  duration: row[3],
  requiredItems: row[4],
  month: row[5],
  status: row[6],
  description: row[7],
  archived: false,
}));

const chartData = Object.keys(CATEGORY_COLORS).map(category => ({
  category,
  count: INITIAL_SERVICES.filter(service => service.category === category).reduce((total, service) => total + service.month, 0),
  color: CATEGORY_COLORS[category][2],
}));

function CategoryBadge({ category }) {
  const [background, color] = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
  return <span style={{ ...s.categoryBadge, background, color }}>{category}</span>;
}

function ServiceIcon({ category }) {
  const color = (CATEGORY_COLORS[category] || CATEGORY_COLORS.General)[2];
  const glyph = category === 'Laboratory'
    ? <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" /><path d="M8 15h8" /></>
    : category === 'Surgery' || category === 'Grooming'
      ? <><path d="M5 19 19 5" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="6" r="3" /><path d="m9 15 6-6" /></>
      : category === 'General'
        ? <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>
        : <><path d="M12 3v18M8 7h8M8 17h8" /><path d="M8 7c0 2 8 2 8 0M8 17c0-2 8-2 8 0" /></>;
  return <span style={{ ...s.serviceIcon, color }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{glyph}</svg></span>;
}

function SummaryIcon({ type }) {
  const paths = {
    tag: <><path d="M4 5h8l7 7-7 7-8-8V5Z" /><circle cx="8" cy="9" r="1" /></>,
    pulse: <path d="m3 12 4-1 2 6 4-12 2 7 6-1" />,
    dollar: <><path d="M12 3v18M16 7c-1-2-7-2-7 1 0 4 7 1 7 5 0 3-6 4-7 0" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{paths[type]}</svg>;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return <div className="services-chart-tooltip"><strong>{payload[0].payload.category}</strong><span>Performed: {payload[0].value} services</span></div>;
}

function getServiceMaterials(service) {
  if (service.category === 'Confinement') return { medicines: [], supplies: [] };
  if (service.name === 'Rabies Vaccination') return { medicines: [['IMRAB 3TF (Rabies)', '1 vial']], supplies: [['Syringe 5ml', '1 pc'], ['Exam Gloves', '1 pair']] };
  if (service.name === 'Deworming Treatment') return { medicines: [['Pyrantel Pamoate', '1 tablet']], supplies: [['Exam Gloves', '1 pair']] };
  if (service.name === 'Spay Surgery (Female)') return { medicines: [['Meloxicam (post-op)', '1 bottle'], ['Amoxicillin 500mg', '7 tablets']], supplies: [['IV Catheter 22G', '1 pc'], ['Syringe 5ml', '3 pcs']] };
  if (service.category === 'Dental') return { medicines: [['Amoxicillin 500mg', '5 tablets']], supplies: [['IV Catheter 22G', '1 pc']] };
  if (service.name === 'CBC (Complete Blood Count)') return { medicines: [], supplies: [['Blood Tube (EDTA)', '1 tube'], ['Syringe 5ml', '1 pc']] };
  return { medicines: [], supplies: [['Exam Gloves', '1 pair']] };
}

export default function ServicesManagementPage({ user }) {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [status, setStatus] = useState('All Statuses');
  const [showArchived, setShowArchived] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Consultation', price: '', duration: '', description: '', status: 'Available', medicines: [], supplies: [] });

  const canView = String(user.role || '').trim().toLowerCase() === 'owner'
    || canViewFeature(user.permissions, user.role, 'Services Management');
  const visibleServices = useMemo(() => services.filter(service => (
    (showArchived ? service.archived : !service.archived)
    && (category === 'All Categories' || service.category === category)
    && (status === 'All Statuses' || service.status === status)
    && `${service.name} ${service.description}`.toLowerCase().includes(search.toLowerCase())
  )), [category, search, services, showArchived, status]);

  const openAdd = () => {
    setForm({ name: '', category: 'Consultation', price: '', duration: '', description: '', status: 'Available', medicines: [], supplies: [] });
    setModal({ type: 'add' });
  };
  const openEdit = service => {
    setForm({ name: service.name, category: service.category, price: service.price, duration: service.duration, description: service.description, status: service.status, medicines: [], supplies: [] });
    setModal({ type: 'edit', service });
  };
  const saveService = event => {
    event.preventDefault();
    const next = { ...form, price: Number(form.price) || 0, requiredItems: form.medicines.length + form.supplies.length, month: modal.type === 'edit' ? modal.service.month : 0, archived: false };
    if (modal.type === 'edit') setServices(current => current.map(service => service.id === modal.service.id ? { ...service, ...next } : service));
    else setServices(current => [...current, { ...next, id: `SRV-${String(current.length + 1).padStart(3, '0')}` }]);
    setModal(null);
  };

  if (!canView) {
    return <div style={s.denied}>You do not have permission to view Services Management.</div>;
  }

  return (
    <div className="services-page" style={s.page}>
      <Topbar user={user} title="Services Management" subtitle="Manage clinic services, pricing, required items, and availability" />
      <div style={s.content}>
        <div style={s.summaryGrid}>
          <SummaryCard icon="tag" label="Total Services" value={services.length} detail={`${services.filter(service => service.status === 'Available' && !service.archived).length} available`} color="#087f65" background="#e7f5f2" />
          <SummaryCard icon="pulse" label="Services This Month" value={services.reduce((total, service) => total + service.month, 0)} detail="across all categories" color="#16a34a" background="#f0fdf4" />
          <SummaryCard icon="dollar" label="Estimated Revenue" value={`₱${services.reduce((total, service) => total + service.price * service.month, 0).toLocaleString('en-PH')}`} detail="from services this month" color="#9333ea" background="#faf5ff" />
          <SummaryCard icon="clock" label="Unavailable Services" value={services.filter(service => service.status === 'Unavailable' && !service.archived).length} detail={`${services.filter(service => service.status === 'Available' && !service.archived).length} currently active`} color="#d97706" background="#fffbeb" />
        </div>

        <section style={s.chartCard}>
          <h2 style={s.chartTitle}>Services Performed This Month by Category</h2>
          <div style={{ height: 185 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={120} margin={{ top: 8, right: 8, left: 18, bottom: 0 }}>
                <CartesianGrid stroke="#e8edf3" strokeDasharray="2 3" vertical />
                <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#94a3b8' }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>{chartData.map(item => <Cell key={item.category} fill={item.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div style={s.toolbar}>
          <div className="searchBox" style={s.searchBox}><span style={s.searchIcon}>{Icons.search}</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search services..." /></div>
          <select value={category} onChange={event => setCategory(event.target.value)} style={s.filter}><option>All Categories</option>{Object.keys(CATEGORY_COLORS).map(item => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={event => setStatus(event.target.value)} style={s.filter}><option>All Statuses</option><option>Available</option><option>Unavailable</option></select>
          <button type="button" style={s.archiveToggle} onClick={() => setShowArchived(value => !value)}><span style={{ ...s.toggle, ...(showArchived ? s.toggleOn : {}) }}><span style={s.toggleKnob} /></span>Show Archived</button>
          <button type="button" className="services-add-button" style={s.addButton} onClick={openAdd}><span style={s.addIcon}>{Icons.plus}</span>Add Service</button>
        </div>

        <section style={s.tableCard}>
          <table className="services-table" style={s.table}>
            <thead><tr>{['Service', 'Category', 'Price', 'Duration', 'Required Items', 'This Month', 'Status', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead>
            <tbody>
              {visibleServices.map(service => (
                <tr key={service.id}>
                  <td><div style={s.serviceName}><ServiceIcon category={service.category} /><div><strong className="service-name-text">{service.name}</strong><small className="service-description-text">{service.description}</small></div></div></td>
                  <td><CategoryBadge category={service.category} /></td>
                  <td style={s.strongCell}>₱{service.price.toLocaleString('en-PH')}</td>
                  <td>{service.duration}</td>
                  <td><button type="button" style={s.itemsLink}>{service.requiredItems ? `${service.requiredItems} ${service.requiredItems === 1 ? 'item' : 'items'}` : '—'}</button></td>
                  <td>{service.month}</td>
                  <td><StatusIndicator status={service.status} /></td>
                  <td><div className="service-actions" style={s.actions}><button className="service-view-action" type="button" title="View" onClick={() => setModal({ type: 'view', service })}>{Icons.eye}</button><button className="service-edit-action" type="button" title="Edit" onClick={() => openEdit(service)}>{Icons.edit}</button><button className="service-delete-action" type="button" title={service.archived ? 'Restore' : 'Archive'} onClick={() => setServices(current => current.map(item => item.id === service.id ? { ...item, archived: !item.archived } : item))}>{Icons.trash}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleServices.length && <div style={s.empty}>No services match your filters.</div>}
        </section>
      </div>

      {modal && modal.type === 'view' && (() => {
        const materials = getServiceMaterials(modal.service);
        const hasMaterials = materials.medicines.length || materials.supplies.length;
        return <div style={s.overlay} onClick={() => setModal(null)}><div className="service-view-modal" style={s.viewModal} onClick={event => event.stopPropagation()}><div style={s.viewHeader}><div className="service-view-heading"><ServiceIcon category={modal.service.category} /><div><h2>{modal.service.name}</h2><p>{modal.service.category}</p></div></div><button type="button" style={s.close} onClick={() => setModal(null)}>×</button></div><p className="service-view-description">{modal.service.description}. {modal.service.category === 'Consultation' ? 'Includes routine examination and treatment planning.' : ''}</p><div className="service-view-stats"><div><small>Standard Price</small><strong>₱{modal.service.price.toLocaleString('en-PH')}</strong></div><div><small>Duration</small><strong>{modal.service.duration}</strong></div></div>{hasMaterials ? <div className="service-material-details">{materials.medicines.length > 0 && <MaterialDetails title={modal.service.category === 'Vaccination' ? 'REQUIRED VACCINES' : 'REQUIRED MEDICINES'} items={materials.medicines} />}{materials.supplies.length > 0 && <MaterialDetails title="REQUIRED SUPPLIES" items={materials.supplies} />}</div> : <p className="service-no-materials">No consumables required for this service.</p>}<div style={s.modalFooter}><button type="button" style={s.cancelButton} onClick={() => setModal(null)}>Close</button></div></div></div>;
      })()}
      {modal && (modal.type === 'add' || modal.type === 'edit') && <div style={s.overlay} onClick={() => setModal(null)}><form className={modal.type === 'edit' ? 'service-edit-modal' : 'service-add-modal'} style={{ ...s.modal, ...s.serviceModal }} onSubmit={saveService} onClick={event => event.stopPropagation()}><div style={s.modalHeader}><div><h2 className="service-modal-title">{modal.type === 'add' ? 'Add New Service' : 'Edit Service'}</h2><p className="service-modal-subtitle">{modal.type === 'add' ? 'Register a new service offered by the clinic.' : `Update details for ${modal.service.name}`}</p></div><button type="button" style={s.close} onClick={() => setModal(null)}>×</button></div><div style={s.formGrid}><label className="service-form-label service-form-full">Service Name*<input className="service-form-control service-form-focus" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. General Consultation" /></label><label className="service-form-label">Category*<select className="service-form-control" value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{Object.keys(CATEGORY_COLORS).map(item => <option key={item}>{item}</option>)}</select></label><label className="service-form-label">Status<select className="service-form-control" value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option>Available</option><option>Unavailable</option></select></label><label className="service-form-label">Standard Price (₱)*<input className="service-form-control" required type="number" min="0" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} placeholder="500" /></label><label className="service-form-label">Duration (minutes)<input className="service-form-control" value={form.duration} onChange={event => setForm({ ...form, duration: event.target.value })} placeholder="30 (leave blank = per day)" /></label><label className="service-form-label service-form-full">Description<textarea className="service-form-control service-form-textarea" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Brief description of the service..." /></label></div>{modal.type === 'add' && <><MaterialSection title="REQUIRED MEDICINES / VACCINES" items={form.medicines} setItems={items => setForm({ ...form, medicines: items })} placeholder="Medicine name" unitPlaceholder="Unit (e.g. tablet)" buttonLabel="Add Medicine" /><MaterialSection title="REQUIRED SUPPLIES" items={form.supplies} setItems={items => setForm({ ...form, supplies: items })} placeholder="Supply name" unitPlaceholder="Unit (e.g. pair)" buttonLabel="Add Supply" /></>}<div style={s.modalFooter}><button type="button" style={s.cancelButton} onClick={() => setModal(null)}>Cancel</button><button className="saveButton" type="submit" style={s.saveButton}><span style={s.addIcon}>{modal.type === 'add' ? Icons.plus : null}</span>{modal.type === 'add' ? 'Add Service' : 'Save Changes'}</button></div></form></div>}
    </div>
  );
}

function SummaryCard({ icon, label, value, detail, color, background }) {
  return <div className="summaryCard" style={s.summaryCard}><span style={{ ...s.summaryIcon, color, background }}><SummaryIcon type={icon} /></span><div><small className="summary-card-label">{label}</small><strong style={{ color }}>{value}</strong><em>{detail}</em></div></div>;
}

function MaterialSection({ title, items, setItems, placeholder, unitPlaceholder, buttonLabel }) {
  const addItem = () => setItems([...items, { name: '', quantity: '', unit: '' }]);
  const rows = items.length ? items : [{ name: '', quantity: '', unit: '' }];
  return <section style={s.materialSection}><div style={s.materialTitle}>{title}</div>{items.length === 0 && <em style={s.noneText}>None</em>}{rows.map((item, index) => <div key={index} style={s.materialRow}><input className="material-control" value={item.name} onChange={event => { const next = items.length ? items : [{ name: '', quantity: '', unit: '' }]; setItems(next.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: event.target.value } : entry)); }} placeholder={placeholder} /><input className="material-control" value={item.quantity} onChange={event => { const next = items.length ? items : [{ name: '', quantity: '', unit: '' }]; setItems(next.map((entry, itemIndex) => itemIndex === index ? { ...entry, quantity: event.target.value } : entry)); }} placeholder="Qty" /><input className="material-control" value={item.unit} onChange={event => { const next = items.length ? items : [{ name: '', quantity: '', unit: '' }]; setItems(next.map((entry, itemIndex) => itemIndex === index ? { ...entry, unit: event.target.value } : entry)); }} placeholder={unitPlaceholder} /></div>)}<button type="button" style={s.addMaterialButton} onClick={addItem}><span>+</span>{buttonLabel}</button></section>;
}

function Detail({ label, value }) {
  return <div><small style={s.detailLabel}>{label}</small><strong style={s.detailValue}>{value}</strong></div>;
}

function MaterialDetails({ title, items }) {
  return <section className="service-material-detail"><h3>{title}</h3>{items.map(([name, quantity]) => <div key={name}><span>{name}</span><strong>{quantity}</strong></div>)}</section>;
}

const s = {
  page: { minHeight: '100%', background: '#f5f7fa', color: '#334155' },
  content: { padding: '24px 24px 44px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 20 },
  summaryCard: { minHeight: 82, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', border: '1px solid #e1e6ec', borderRadius: 12, background: '#fff' },
  summaryIcon: { width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 8, fontSize: 22, fontWeight: 700 },
  chartCard: { padding: '20px 20px 12px', border: '1px solid #e1e6ec', borderRadius: 12, background: '#fff', marginBottom: 20 },
  chartTitle: { margin: '0 0 16px', color: '#1e293b', fontSize: '.84rem', fontWeight: 700 },
  toolbar: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 11px', borderRadius: 7, background: '#eef1f5', color: '#94a3b8' },
  searchIcon: { width: 14, height: 14, display: 'flex' },
  filter: { height: 34, minWidth: 126, padding: '0 10px', border: 0, borderRadius: 7, background: '#eef1f5', color: '#475569', fontSize: '.72rem' },
  archiveToggle: { display: 'inline-flex', alignItems: 'center', gap: 7, color: '#64748b', fontSize: '.72rem', whiteSpace: 'nowrap' },
  toggle: { width: 28, height: 16, display: 'inline-flex', alignItems: 'center', padding: 2, borderRadius: 10, background: '#cbd5e1' },
  toggleOn: { background: '#087f65', justifyContent: 'flex-end' },
  toggleKnob: { width: 12, height: 12, borderRadius: '50%', background: '#fff' },
  addButton: { height: 34, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0 13px', borderRadius: 7, background: '#0b0b1c', color: '#fff', fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap' },
  addIcon: { width: 13, height: 13, display: 'flex' },
  tableCard: { overflow: 'hidden', border: '1px solid #e1e6ec', borderRadius: 10, background: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '.72rem' },
  serviceName: { display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 },
  serviceIcon: { width: 15, height: 17, flexShrink: 0, display: 'flex' },
  categoryBadge: { display: 'inline-block', padding: '4px 9px', borderRadius: 7, fontSize: '.64rem', fontWeight: 700 },
  strongCell: { color: '#1e293b', fontWeight: 700 },
  itemsLink: { color: '#087f65', fontSize: '.7rem', fontWeight: 600 },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  empty: { padding: 40, color: '#64748b', textAlign: 'center', fontSize: '.8rem' },
  denied: { padding: 40, color: '#64748b' },
  overlay: { position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15,23,42,.36)' },
  modal: { width: 'min(620px, 100%)', padding: 22, borderRadius: 12, background: '#fff', boxShadow: '0 18px 50px rgba(15,23,42,.2)' },
  viewModal: { width: 'min(520px, calc(100vw - 32px))', padding: '18px 24px 20px', borderRadius: 11, background: '#fff', boxShadow: '0 18px 50px rgba(15,23,42,.2)' },
  viewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceModal: { width: 'min(550px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 28px)', overflowY: 'auto', padding: '20px 22px 18px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  close: { color: '#64748b', fontSize: 24, lineHeight: 1 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 20, padding: '16px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' },
  detailLabel: { display: 'block', marginBottom: 5, color: '#94a3b8', fontSize: '.65rem' },
  detailValue: { color: '#334155', fontSize: '.78rem' },
  description: { margin: '16px 0 0', color: '#64748b', fontSize: '.76rem', lineHeight: 1.5 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 14, rowGap: 12 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  cancelButton: { padding: '8px 13px', border: '1px solid #cbd5e1', borderRadius: 6, color: '#111827', fontSize: '.72rem' },
  saveButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 130, padding: '8px 13px', borderRadius: 6, background: '#08081a', color: '#fff', fontSize: '.72rem', fontWeight: 700 },
  materialSection: { marginTop: 14, padding: '12px 12px 11px', border: '1px solid #dbe1e8', borderRadius: 10 },
  materialTitle: { color: '#334155', fontSize: '.67rem', fontWeight: 600, letterSpacing: '.04em' },
  noneText: { display: 'block', margin: '7px 0 6px', color: '#64748b', fontSize: '.68rem' },
  materialRow: { display: 'grid', gridTemplateColumns: '1.2fr .8fr 1.2fr', gap: 8, marginTop: 7 },
  addMaterialButton: { display: 'inline-flex', alignItems: 'center', gap: 9, marginTop: 8, padding: '7px 11px', border: '1px solid #dbe3ee', borderRadius: 7, color: '#111827', fontSize: '.72rem', fontWeight: 600 },
};
