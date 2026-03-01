import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import { useAlert } from "../store/alert.store";
import { apiFetch } from "../services/api";
import { useProfileStore } from "../store/profile.store";
import ProductSkeleton from "../components/product/ProductSkeleton";

interface ProfileData {
  name: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  walletCredit?: number;
  referralCode?: string;
}

export default function Profile() {
  const { showAlert } = useAlert();

  const profile = useProfileStore((s) => s.profile);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const refreshProfile = useProfileStore((s) => s.refreshProfile);
  const loadingProfile = useProfileStore((s) => s.loading);
  const [form, setForm] = useState<ProfileData | null>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const handleSave = async () => {
    if (!form?.name || !form.address) {
      showAlert({
        type: "error",
        message: "Name and Address are required",
      });
      return;
    }

    setSaving(true);

    try {
      await apiFetch("/user/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city?.trim(),
          state: form.state?.trim(),
          pincode: form.pincode?.trim(),
        }),
      });

      await refreshProfile();
      setIsEditing(false);
      showAlert({
        type: "success",
        message: "Profile updated successfully",
      });
    } catch (err: any) {
      showAlert({
        type: "error",
        message: err.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) setForm(profile);
    setIsEditing(false);
  };

  const handleCopyReferral = () => {
    if (!form?.referralCode) return;
    navigator.clipboard.writeText(form.referralCode);
    showAlert({
      type: "success",
      message: "Referral code copied!",
    });
  };

  if (loadingProfile || !form) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-[var(--color-surface)] border rounded-2xl p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[var(--color-primary)]">
            My Profile
          </h1>

          {!isEditing && (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        {/* WALLET + REFERRAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Wallet Credit */}
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">Wallet Credit Available</p>

            <p className="text-2xl font-bold text-green-700">
              ₹{form.walletCredit || 0}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Auto-used during checkout
            </p>
          </div>

          {/* Referral Code */}
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">Your Referral Code</p>

            <div className="flex items-center justify-between mt-1">
              <p className="text-xl font-bold tracking-wide text-[var(--color-primary)]">
                {form.referralCode || "Not Available"}
              </p>

              {form.referralCode && (
                <button
                  onClick={handleCopyReferral}
                  className="text-xs px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                >
                  Copy
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-1">
              Invite friends and earn after their first paid order.
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mobile */}
          <div>
            <label className="text-sm text-[var(--color-muted)]">
              Mobile Number
            </label>
            <input
              value={form.mobile}
              disabled
              className="w-full border rounded-md p-2 bg-gray-100"
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-[var(--color-muted)]">Name</label>
            <input
              value={form.name}
              disabled={!isEditing}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="text-sm text-[var(--color-muted)]">Address</label>
            <textarea
              rows={3}
              value={form.address}
              disabled={!isEditing}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* City */}
          <div>
            <label className="text-sm text-[var(--color-muted)]">City</label>
            <input
              value={form.city}
              disabled={!isEditing}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* State */}
          <div>
            <label className="text-sm text-[var(--color-muted)]">State</label>
            <input
              value={form.state}
              disabled={!isEditing}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* Pincode */}
          <div>
            <label className="text-sm text-[var(--color-muted)]">Pincode</label>
            <input
              value={form.pincode}
              disabled={!isEditing}
              maxLength={6}
              onChange={(e) =>
                setForm({
                  ...form,
                  pincode: e.target.value.replace(/\D/g, ""),
                })
              }
              className="w-full border rounded-md p-2"
            />
          </div>
        </div>

        {/* ACTIONS */}
        {isEditing && (
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}