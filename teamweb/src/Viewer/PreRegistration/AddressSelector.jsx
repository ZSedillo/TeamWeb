import React, { useState, useEffect } from 'react';

import regionData from '../../assets/ph-json/region.json';
import provinceData from '../../assets/ph-json/province.json';
import cityData from '../../assets/ph-json/city.json';
import barangayData from '../../assets/ph-json/barangay.json';

function AddressSelector({ onAddressChange }) {
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [street, setStreet] = useState('');
  const [touched, setTouched] = useState(false);

  const [filteredProvinces, setFilteredProvinces] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredBarangays, setFilteredBarangays] = useState([]);

  useEffect(() => {
    if (region) {
      setFilteredProvinces(provinceData.filter(p => p.region_code === region));
      setProvince('');
      setCity('');
      setBarangay('');
      setFilteredCities([]);
      setFilteredBarangays([]);
    }
    // Only run when region changes
  }, [region]);

  useEffect(() => {
    if (province) {
      setFilteredCities(cityData.filter(c => c.province_code === province));
      setCity('');
      setBarangay('');
      setFilteredBarangays([]);
    }
    // Only run when province changes
  }, [province]);

  useEffect(() => {
    if (city) {
      setFilteredBarangays(barangayData.filter(b => b.city_code === city));
      setBarangay('');
    }
    // Only run when city changes
  }, [city]);

  useEffect(() => {
    // Only run when address fields change, not on every render
    if (region && province && city && barangay && street.trim()) {
      const regionName = regionData.find(r => r.region_code === region)?.region_name || '';
      const provinceName = provinceData.find(p => p.province_code === province)?.province_name || '';
      const cityName = cityData.find(c => c.city_code === city)?.city_name || '';
      const barangayName = barangayData.find(b => b.brgy_code === barangay)?.brgy_name || '';
      const fullAddress = `${barangayName}, ${cityName}, ${provinceName}, ${regionName}, ${street}`;
      onAddressChange(fullAddress);
    } else {
      onAddressChange('');
    }
  }, [region, province, city, barangay, street]);

  const showStreetError = touched && !street.trim();

  return (
    <div className="address-selector-grid">
      <div className="address-selector-row">
        <div className="address-selector-col">
          <label>Region <span className="pre-reg-required">*</span></label>
          <select value={region} onChange={e => setRegion(e.target.value)} required className="pre-reg-input">
            <option value='' disabled>Select Region</option>
            {regionData.map(r => (
              <option key={r.region_code} value={r.region_code}>{r.region_name}</option>
            ))}
          </select>
        </div>
        <div className="address-selector-col">
          <label>Province <span className="pre-reg-required">*</span></label>
          <select value={province} onChange={e => setProvince(e.target.value)} required disabled={!region} className="pre-reg-input">
            <option value='' disabled>Select Province</option>
            {filteredProvinces.map(p => (
              <option key={p.province_code} value={p.province_code}>{p.province_name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="address-selector-row">
        <div className="address-selector-col">
          <label>City / Municipality <span className="pre-reg-required">*</span></label>
          <select value={city} onChange={e => setCity(e.target.value)} required disabled={!province} className="pre-reg-input">
            <option value='' disabled>Select City/Municipality</option>
            {filteredCities.map(c => (
              <option key={c.city_code} value={c.city_code}>{c.city_name}</option>
            ))}
          </select>
        </div>
        <div className="address-selector-col">
          <label>Barangay <span className="pre-reg-required">*</span></label>
          <select value={barangay} onChange={e => setBarangay(e.target.value)} required disabled={!city} className="pre-reg-input">
            <option value='' disabled>Select Barangay</option>
            {filteredBarangays.map(b => (
              <option key={b.brgy_code} value={b.brgy_code}>{b.brgy_name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="address-selector-row">
        <div className="address-selector-col" style={{width: '100%'}}>
          <label htmlFor="street">STREET NAME, BUILDING, HOUSE NO. <span className="pre-reg-required">*</span></label>
          <input
            id="street"
            type="text"
            value={street}
            onChange={e => { setStreet(e.target.value); setTouched(true); }}
            onBlur={() => setTouched(true)}
            placeholder="House No., Street, Building, etc."
            className="pre-reg-input"
            required
          />
          {showStreetError && <div className="error">Street Name, Building, House No. is required</div>}
        </div>
      </div>
    </div>
  );
}

export default AddressSelector;
