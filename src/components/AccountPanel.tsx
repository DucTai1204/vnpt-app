import React, { useEffect, useState } from 'react';
import { Check, Loader2, MapPin, Phone, Plus, Star, Trash2, User } from 'lucide-react';
import { useOptions, useSetting } from '../api/BootstrapContext';
import { useAuth } from '../api/AuthContext';
import {
  AddressInput,
  ApiAddress,
  ApiDisease,
  ApiError,
  ApiRecipient,
  createAddress,
  createRecipient,
  deleteAddress,
  getAddresses,
  getDiseases,
  getRecipients,
  RecipientInput,
  setDefaultAddress,
  updateAddress,
  updateRecipient,
} from '../api/client';
import { AppStatus } from './AppStatus';
import { LogoutButton } from './LogoutButton';

const EMPTY_ADDRESS: AddressInput = {
  contactName: '',
  contactPhone: '',
  addressLine: '',
  ward: '',
  district: '',
  province: '',
  locationType: 'nha_rieng',
  isDefault: false,
};

const inputClass =
  'w-full px-4 py-2.5 bg-white border border-hairline rounded-xl text-[length:var(--fs-body)] ' +
  'text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand transition-colors';

/**
 * Màn Tài khoản: hồ sơ, sổ địa chỉ và bệnh nền của người được chăm.
 *
 * Mọi lựa chọn (loại địa điểm, giới tính, danh sách bệnh lý) đều lấy từ backend,
 * không gán cứng — thêm một bệnh trong bảng `benh_ly` là màn này tự có thêm.
 */
export const AccountPanel: React.FC<{ bookerName: string }> = ({ bookerName }) => {
  const { profile } = useAuth();
  const hotline = useSetting('app.hotline', '');
  const locationOptions = useOptions('loai_dia_diem');
  const genderOptions = useOptions('gioi_tinh');

  const [addresses, setAddresses] = useState<ApiAddress[] | null>(null);
  const [recipients, setRecipients] = useState<ApiRecipient[] | null>(null);
  const [diseases, setDiseases] = useState<ApiDisease[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [editingAddress, setEditingAddress] = useState<number | 'new' | null>(null);
  const [addressForm, setAddressForm] = useState<AddressInput>(EMPTY_ADDRESS);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);

  const reload = () => setAttempt((n) => n + 1);

  useEffect(() => {
    const c = new AbortController();
    setError(null);

    Promise.all([getAddresses(c.signal), getRecipients(c.signal), getDiseases(c.signal)])
      .then(([a, r, d]) => {
        setAddresses(a);
        setRecipients(r);
        setDiseases(d);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError(
          err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không tải được tài khoản'),
        );
      });

    // [R-2.5] Cleanup bắt buộc
    return () => c.abort();
  }, [attempt]);

  /** Bọc mọi thao tác ghi: khoá nút, bắt lỗi, tải lại danh sách khi xong. */
  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setSaveError(null);
    try {
      await fn();
      setEditingAddress(null);
      reload();
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không lưu được thay đổi'),
      );
    } finally {
      setBusy(false);
    }
  };

  const openAddress = (a: ApiAddress | null) => {
    setSaveError(null);
    if (a) {
      setEditingAddress(a.id);
      setAddressForm({
        contactName: a.contactName ?? '',
        contactPhone: a.contactPhone ?? '',
        addressLine: a.addressLine,
        ward: a.ward ?? '',
        district: a.district ?? '',
        province: a.province ?? '',
        locationType: a.locationType,
        hospitalName: a.hospitalName ?? '',
        note: a.note ?? '',
        isDefault: a.isDefault === 1,
      });
    } else {
      setEditingAddress('new');
      setAddressForm({
        ...EMPTY_ADDRESS,
        contactName: profile?.displayName ?? bookerName,
        contactPhone: profile?.phone ?? '',
        locationType: locationOptions.find((o) => o.isDefault)?.value ?? 'nha_rieng',
      });
    }
  };

  /** Bật/tắt một bệnh nền của người được chăm; ghi thẳng lên backend. */
  const toggleDisease = (r: ApiRecipient, code: string) => {
    const has = r.diseases.some((d) => d.code === code);
    const next = has
      ? r.diseases.filter((d) => d.code !== code).map((d) => d.code)
      : [...r.diseases.map((d) => d.code), code];

    const payload: RecipientInput = {
      fullName: r.fullName,
      gender: r.gender ?? genderOptions[0]?.value ?? 'khac',
      age: r.age,
      relationship: r.relationship,
      specialNotes: r.specialNotes,
      isDefault: r.isDefault === 1,
      diseaseCodes: next,
    };
    void run(() => updateRecipient(r.id, payload));
  };

  if (error) {
    return (
      <AppStatus
        inline
        kind={error.code === 'NO_INTERNET' ? 'offline' : 'error'}
        message={error.message}
        onRetry={reload}
      />
    );
  }

  if (!addresses || !recipients || !diseases) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-stone-100 animate-pulse" aria-hidden="true" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hồ sơ */}
      <section className="bg-white rounded-2xl border border-hairline p-5 sm:p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-hairline">
          <div className="w-12 h-12 rounded-full bg-brand-surface text-brand flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-navy">{profile?.displayName ?? bookerName}</p>
            <p className="text-sm text-muted">{profile?.phone ?? ''}</p>
          </div>
        </div>

        {hotline && (
          <a
            href={`tel:${hotline}`}
            className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-accent transition-colors mt-4"
          >
            <Phone className="w-4 h-4" />
            <span>Tổng đài hỗ trợ {hotline}</span>
          </a>
        )}

        <div className="mt-4">
          <LogoutButton variant="full" alwaysShow className="w-full sm:w-auto" />
        </div>
      </section>

      {saveError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-accent-surface p-3">
          <p className="text-sm text-accent">{saveError.message}</p>
        </div>
      )}

      {/* Sổ địa chỉ */}
      <section className="bg-white rounded-2xl border border-hairline p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-navy">Địa chỉ của tôi</h3>
          <button
            type="button"
            onClick={() => openAddress(null)}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-text cursor-pointer hover:underline"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm địa chỉ</span>
          </button>
        </div>

        {addresses.length === 0 && editingAddress === null && (
          <p className="text-sm text-muted">Chưa có địa chỉ nào. Thêm một địa chỉ để đặt nhanh hơn.</p>
        )}

        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-xl border border-hairline p-4">
              {editingAddress === a.id ? (
                <AddressForm
                  value={addressForm}
                  onChange={setAddressForm}
                  options={locationOptions}
                  busy={busy}
                  onCancel={() => setEditingAddress(null)}
                  onSave={() => run(() => updateAddress(a.id, addressForm))}
                />
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-navy">{a.contactName}</span>
                      <span className="text-sm text-muted">{a.contactPhone}</span>
                      {a.isDefault === 1 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-surface text-brand-text">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink mt-1">
                      {[a.addressLine, a.ward, a.district, a.province].filter(Boolean).join(', ')}
                    </p>

                    <div className="flex items-center gap-4 mt-3">
                      <button
                        type="button"
                        onClick={() => openAddress(a)}
                        className="text-sm font-semibold text-brand-text cursor-pointer hover:underline"
                      >
                        Sửa
                      </button>
                      {a.isDefault !== 1 && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(() => setDefaultAddress(a.id))}
                          className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-navy cursor-pointer disabled:opacity-50"
                        >
                          <Star className="w-4 h-4" />
                          <span>Đặt mặc định</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(() => deleteAddress(a.id))}
                        className="flex items-center gap-1 text-sm font-semibold text-accent cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Xoá</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {editingAddress === 'new' && (
            <div className="rounded-xl border border-brand-border bg-canvas p-4">
              <AddressForm
                value={addressForm}
                onChange={setAddressForm}
                options={locationOptions}
                busy={busy}
                onCancel={() => setEditingAddress(null)}
                onSave={() => run(() => createAddress(addressForm))}
              />
            </div>
          )}
        </div>
      </section>

      {/* Bệnh nền của người được chăm */}
      <section className="bg-white rounded-2xl border border-hairline p-5 sm:p-6">
        <h3 className="text-lg font-bold text-navy mb-1">Bệnh nền người được chăm</h3>
        <p className="text-sm text-muted mb-4">
          Lưu sẵn ở đây thì lần đặt sau không phải chọn lại.
        </p>

        {recipients.length === 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() =>
                createRecipient({
                  fullName: profile?.displayName ?? bookerName,
                  gender: genderOptions.find((o) => o.isDefault)?.value ?? 'khac',
                  isDefault: true,
                  diseaseCodes: [],
                }),
              )
            }
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-text cursor-pointer hover:underline disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo hồ sơ người được chăm</span>
          </button>
        ) : (
          <div className="space-y-5">
            {recipients.map((r) => (
              <div key={r.id}>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="font-bold text-navy">{r.fullName ?? 'Người được chăm'}</span>
                  {r.age != null && <span className="text-sm text-muted">{r.age} tuổi</span>}
                  {r.isDefault === 1 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-surface text-brand-text">
                      Mặc định
                    </span>
                  )}
                </div>

                {/* Nguồn: bảng `benh_ly` qua /catalog/diseases */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {diseases.map((d) => {
                    const on = r.diseases.some((x) => x.code === d.code);
                    return (
                      <button
                        key={d.code}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        disabled={busy}
                        onClick={() => toggleDisease(r, d.code)}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors cursor-pointer disabled:opacity-60 ${
                          on
                            ? 'border-brand bg-pill-surface'
                            : 'border-hairline bg-white hover:border-brand-border'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 shrink-0 rounded-md flex items-center justify-center ${
                            on ? 'bg-check-green' : 'bg-white border border-hairline'
                          }`}
                        >
                          {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </span>
                        <span
                          className={`text-[length:var(--fs-body)] font-semibold ${
                            on ? 'text-pill-on' : 'text-ink'
                          }`}
                        >
                          {d.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted mt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang lưu...</span>
          </p>
        )}
      </section>
    </div>
  );
};

/* ------------------------------ Form địa chỉ ------------------------------ */

interface AddressFormProps {
  value: AddressInput;
  onChange: (v: AddressInput) => void;
  options: { value: string; label: string }[];
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({
  value,
  onChange,
  options,
  busy,
  onCancel,
  onSave,
}) => {
  const set = (patch: Partial<AddressInput>) => onChange({ ...value, ...patch });
  const valid =
    value.contactName.trim() && value.contactPhone.trim() && value.addressLine.trim().length >= 3;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className={inputClass}
          value={value.contactName}
          onChange={(e) => set({ contactName: e.target.value })}
          placeholder="Tên người nhận"
        />
        <input
          className={inputClass}
          type="tel"
          inputMode="numeric"
          value={value.contactPhone}
          onChange={(e) => set({ contactPhone: e.target.value })}
          placeholder="Số điện thoại"
        />
      </div>

      <input
        className={inputClass}
        value={value.addressLine}
        onChange={(e) => set({ addressLine: e.target.value })}
        placeholder="Số nhà, đường"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          className={inputClass}
          value={value.ward ?? ''}
          onChange={(e) => set({ ward: e.target.value })}
          placeholder="Phường/xã"
        />
        <input
          className={inputClass}
          value={value.district ?? ''}
          onChange={(e) => set({ district: e.target.value })}
          placeholder="Quận/huyện"
        />
        <input
          className={inputClass}
          value={value.province ?? ''}
          onChange={(e) => set({ province: e.target.value })}
          placeholder="Tỉnh/thành phố"
        />
      </div>

      {/* Nguồn: bộ lựa chọn `loai_dia_diem` của backend */}
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value.locationType === o.value}
            onClick={() => set({ locationType: o.value })}
            className={`h-11 rounded-xl border text-[length:var(--fs-body)] font-medium transition-colors cursor-pointer ${
              value.locationType === o.value
                ? 'bg-pill-surface text-pill-on border-brand'
                : 'bg-white text-ink border-hairline hover:border-brand-border'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer w-fit">
        <span
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
            value.isDefault ? 'bg-check-green' : 'bg-white border border-hairline'
          }`}
        >
          {value.isDefault && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </span>
        <input
          type="checkbox"
          checked={Boolean(value.isDefault)}
          onChange={(e) => set({ isDefault: e.target.checked })}
          className="sr-only"
        />
        <span className="text-[length:var(--fs-body)] text-ink">Địa chỉ mặc định</span>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={busy || !valid}
          onClick={onSave}
          className="h-11 px-6 rounded-xl bg-cta-blue hover:bg-cta-blue-dark text-white font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-4 rounded-xl text-muted font-semibold cursor-pointer hover:text-navy"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
};
