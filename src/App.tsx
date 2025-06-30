import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  ChartEvent,
  LegendItem,
  ActiveElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { createRoot } from "react-dom/client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const endpoint =
  "https://script.google.com/macros/s/AKfycbyUM4Llfs7dTyfP-9JyyK5sGg7lEKiz36vHhdnrU2BRiUxOSEdRNjlw5AGrTr2JrrFz/exec";

interface Student {
  id: string;
  name: string | null | undefined;
  nisn: string | null | undefined;
  kelas: string | null | undefined;
}

type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpha";

interface AttendanceRecord {
  [date: string]: {
    [studentId: string]: AttendanceStatus;
  };
}

interface MonthlyRecap {
  nama: string;
  kelas: string;
  hadir: number;
  alpa: number;
  izin: number;
  sakit: number;
  persenHadir: number;
}

interface GraphData {
  [month: string]: {
    Hadir: number;
    Alpha: number;
    Izin: number;
    Sakit: number;
  };
}

interface StatusSummary {
  Hadir: number;
  Izin: number;
  Sakit: number;
  Alpha: number;
}

interface StatusVisibility {
  Hadir: boolean;
  Alpha: boolean;
  Izin: boolean;
  Sakit: boolean;
}

interface AttendanceHistory {
  tanggal: string;
  nama: string;
  kelas: string;
  nisn: string;
  status: AttendanceStatus;
}

const formatDateDDMMYYYY = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
};

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!username || !password) {
      setError("⚠️ Username dan password wajib diisi!");
      return;
    }

    if (username === "admin" && password === "12345") {
      setError("");
      setUsername("");
      setPassword("");
      onLogin();
    } else {
      setError("❌ Gagal login. Username atau password salah.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          🔐 Login
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg"
            placeholder="Masukkan username"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg"
            placeholder="Masukkan password"
          />
        </div>
        <div className="text-center">
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentDataTab: React.FC<{
  students: Student[];
  onRefresh: () => void;
  uniqueClasses: string[];
}> = ({ students, onRefresh, uniqueClasses }) => {
  const [nisn, setNisn] = useState("");
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState<string>("Semua");

  const handleSubmit = () => {
    if (!nisn || !nama || !kelas) {
      alert("⚠️ Semua field wajib diisi!");
      return;
    }

    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "siswa",
        nisn,
        nama,
        kelas,
      }),
    })
      .then(() => {
        alert("✅ Siswa berhasil ditambahkan!");
        setNisn("");
        setNama("");
        setKelas("");
        onRefresh();
      })
      .catch(() => alert("❌ Gagal menambahkan siswa."));
  };

  const handleEditStudent = (student: Student) => {
    const newNisn = prompt("Edit NISN:", student.nisn ?? undefined);
    const newName = prompt("Edit nama siswa:", student.name ?? undefined);
    const newClass = prompt("Edit kelas siswa:", student.kelas ?? undefined);

    if (newNisn && newName && newClass) {
      fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "edit",
          nisnLama: student.nisn,
          nisnBaru: newNisn,
          nama: newName,
          kelas: newClass,
        }),
      })
        .then(() => {
          alert("✅ Data siswa berhasil diperbarui");
          onRefresh();
        })
        .catch(() => alert("❌ Gagal memperbarui data"));
    }
  };

  const handleDeleteStudent = (nisn: string | null | undefined) => {
    if (!nisn) {
      alert("❌ NISN tidak valid untuk penghapusan.");
      return;
    }
    if (confirm("Yakin ingin menghapus siswa ini?")) {
      fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "delete",
          nisn: nisn,
        }),
      })
        .then(() => {
          alert("🗑️ Data siswa berhasil dihapus");
          onRefresh();
        })
        .catch(() => alert("❌ Gagal menghapus siswa"));
    }
  };

  const filteredStudents = React.useMemo(() => {
    if (!searchQuery.trim() && selectedKelas === "Semua") return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter((student) => {
      const matchesSearchQuery =
        !searchQuery.trim() ||
        (student.name && String(student.name).toLowerCase().includes(query)) ||
        (student.nisn && String(student.nisn).toLowerCase().includes(query));
      const matchesKelas =
        selectedKelas === "Semua" ||
        (student.kelas && String(student.kelas).trim() === selectedKelas);
      return matchesSearchQuery && matchesKelas;
    });
  }, [students, searchQuery, selectedKelas]);

  return (
    <div className="max-w-4xl mx-auto" style={{ paddingBottom: "70px" }}>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-center text-blue-600">
          Tambah Data Siswa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="NISN"
            value={nisn}
            onChange={(e) => setNisn(e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg"
          />
          <input
            type="text"
            placeholder="Nama Siswa"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg"
          />
          <input
            type="text"
            placeholder="Kelas"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg"
          />
        </div>
        <div className="text-center">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            ➕ Tambah Siswa
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Pencarian Siswa
        </h3>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg"
          />
        </div>
        <div className="mb-4">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm bg-white"
          >
            {uniqueClasses.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Daftar Siswa ({filteredStudents.length})
        </h3>
        {filteredStudents.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {searchQuery || selectedKelas !== "Semua"
              ? "Tidak ada siswa yang cocok dengan pencarian atau filter kelas."
              : "Belum ada data siswa."}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((s) => (
              <div
                key={s.id}
                className="flex justify-between items-center bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">{s.name || "N/A"}</p>
                  <p className="text-sm text-gray-600">
                    NISN: {s.nisn || "N/A"} | Kelas: {s.kelas || "N/A"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditStudent(s)}
                    className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(s.nisn)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceTab: React.FC<{
  students: Student[];
  onRecapRefresh: () => void;
}> = ({ students, onRecapRefresh }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedKelas, setSelectedKelas] = useState<string>("Semua");
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);

  const uniqueClasses = React.useMemo(() => {
    console.log("Memproses siswa untuk kelas:", students);
    const classSet = new Set<string>();
    students.forEach((student) => {
      console.log(
        "Siswa:",
        student.name,
        "Kelas:",
        student.kelas,
        "Tipe:",
        typeof student.kelas
      );
      let kelasValue = student.kelas;
      if (kelasValue != null) {
        kelasValue = String(kelasValue).trim();
        if (
          kelasValue !== "" &&
          kelasValue !== "undefined" &&
          kelasValue !== "null"
        ) {
          classSet.add(kelasValue);
        }
      }
    });
    const classes = Array.from(classSet).sort((a, b) => {
      const aIsNum = /^\d+$/.test(a);
      const bIsNum = /^\d+$/.test(b);
      if (aIsNum && bIsNum) {
        return parseInt(a) - parseInt(b);
      } else if (aIsNum && !bIsNum) {
        return -1;
      } else if (!aIsNum && bIsNum) {
        return 1;
      } else {
        return a.localeCompare(b);
      }
    });
    console.log("Kelas unik yang ditemukan:", classes);
    return ["Semua", ...classes];
  }, [students]);

  const filteredStudents = React.useMemo(() => {
    if (selectedKelas === "Semua") {
      return students;
    }
    return students.filter((student) => {
      if (student.kelas == null) return false;
      const studentKelas = String(student.kelas).trim();
      const result = studentKelas === selectedKelas;
      console.log(
        `Menyaring: ${student.name} (${studentKelas}) === ${selectedKelas} = ${result}`
      );
      return result;
    });
  }, [students, selectedKelas]);

  useEffect(() => {
    if (students.length && !attendance[date]) {
      const init: { [key: string]: AttendanceStatus } = {};
      students.forEach((s) => (init[s.id] = "Hadir"));
      setAttendance((prev) => ({ ...prev, [date]: init }));
    }
  }, [date, students, attendance]);

  const setStatus = (sid: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [date]: { ...prev[date], [sid]: status },
    }));
  };

  const handleSave = () => {
    const formattedDate = formatDateDDMMYYYY(date);
    const studentsToSave =
      selectedKelas === "Semua" ? students : filteredStudents;

    const data = studentsToSave.map((s) => ({
      tanggal: formattedDate,
      nama: s.name || "N/A",
      kelas: s.kelas || "N/A",
      nisn: s.nisn || "N/A",
      status: attendance[date]?.[s.id] || "Hadir",
    }));

    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(() => {
        const message =
          selectedKelas === "Semua"
            ? "✅ Data absensi semua kelas berhasil dikirim!"
            : `✅ Data absensi kelas ${selectedKelas} berhasil dikirim!`;
        alert(message);
        onRecapRefresh();
      })
      .catch(() => alert("❌ Gagal kirim data absensi."));
  };

  const statusColor: Record<AttendanceStatus, string> = {
    Hadir: "bg-green-500",
    Izin: "bg-yellow-400",
    Sakit: "bg-blue-400",
    Alpha: "bg-red-500",
  };

  const getAttendanceSummary = (): StatusSummary => {
    const summary: StatusSummary = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
    filteredStudents.forEach((s) => {
      const status = (attendance[date]?.[s.id] || "Hadir") as AttendanceStatus;
      summary[status]++;
    });
    return summary;
  };

  const attendanceSummary = getAttendanceSummary();

  return (
    <div className="max-w-4xl mx-auto" style={{ paddingBottom: "70px" }}>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          📋 Absensi Siswa
        </h2>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Tanggal</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-1 py-0.5 shadow-sm"
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Filter Kelas</p>
            <select
              value={selectedKelas}
              onChange={(e) => {
                console.log("Mengubah filter kelas ke:", e.target.value);
                setSelectedKelas(e.target.value);
              }}
              className="border border-gray-300 rounded-lg px-1 py-0.5 shadow-sm bg-white min-w-32"
            >
              {uniqueClasses.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="text-sm bg-gray-200 hover:bg-gray-300 px-1 py-0.5 rounded-lg"
            >
              🔍 Info Debug
            </button>
          </div>
        </div>

        {showDebugInfo && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Informasi Debug:
            </h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>
                <strong>Total Siswa:</strong> {students.length}
              </p>
              <p>
                <strong>Kelas yang Tersedia:</strong> {uniqueClasses.join(", ")}
              </p>
              <p>
                <strong>Kelas Terpilih:</strong> {selectedKelas}
              </p>
              <p>
                <strong>Siswa Terfilter:</strong> {filteredStudents.length}
              </p>
            </div>
            <div className="mt-3">
              <p className="font-semibold text-yellow-800 mb-1">
                Detail Data Siswa per Kelas:
              </p>
              <div className="max-h-32 overflow-y-auto text-xs">
                {uniqueClasses.slice(1).map((kelas) => {
                  const siswaKelas = students.filter(
                    (s) => String(s.kelas).trim() === kelas
                  );
                  return (
                    <div key={kelas} className="mb-1">
                      <strong>Kelas {kelas}:</strong> {siswaKelas.length} siswa
                      {siswaKelas.slice(0, 3).map((s) => (
                        <div key={s.id} className="ml-4 text-gray-600">
                          • {s.name || "N/A"} (NISN: {s.nisn || "N/A"}, Kelas:{" "}
                          {s.kelas || "N/A"})
                        </div>
                      ))}
                      {siswaKelas.length > 3 && (
                        <div className="ml-4 text-gray-500">
                          ... dan {siswaKelas.length - 3} lainnya
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3">
              <p className="font-semibold text-yellow-800 mb-1">
                Sampel Data Siswa Mentah:
              </p>
              <div className="max-h-24 overflow-y-auto text-xs bg-white p-2 rounded border">
                {students.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="text-gray-600">
                    {idx + 1}. {s.name || "N/A"} | Kelas: "{s.kelas || "N/A"}"
                    (type: {typeof s.kelas}) | NISN: "{s.nisn || "N/A"}" (type:{" "}
                    {typeof s.nisn})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600">
            Menampilkan: <span className="font-semibold">{selectedKelas}</span>{" "}
            • Tanggal:{" "}
            <span className="font-semibold">{formatDateDDMMYYYY(date)}</span> •
            Total Siswa:{" "}
            <span className="font-semibold">{filteredStudents.length}</span>
          </p>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Belum ada data siswa.</p>
            <p className="text-sm text-gray-400 mt-2">
              Silakan tambah data siswa terlebih dahulu di tab "Data Siswa"
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Tidak ada siswa di kelas {selectedKelas}.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Pilih kelas lain atau ubah filter ke "Semua"
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-green-600 font-bold text-lg">
                  {attendanceSummary.Hadir}
                </div>
                <div className="text-green-700 text-sm">Hadir</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="text-yellow-600 font-bold text-lg">
                  {attendanceSummary.Izin}
                </div>
                <div className="text-yellow-700 text-sm">Izin</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-blue-600 font-bold text-lg">
                  {attendanceSummary.Sakit}
                </div>
                <div className="text-blue-700 text-sm">Sakit</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="text-red-600 font-bold text-lg">
                  {attendanceSummary.Alpha}
                </div>
                <div className="text-red-700 text-sm">Alpha</div>
              </div>
            </div>

            <div className="space-y-4 mb-6 overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="border-b border-gray-200">
                      <td style={{ width: "6cm" }} className="p-2">
                        <p className="text-base font-semibold text-gray-800">
                          {s.name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Kelas {s.kelas || "N/A"} • NISN: {s.nisn || "N/A"}
                        </p>
                      </td>
                      <td style={{ width: "5cm" }} className="p-2">
                        <div className="flex justify-between">
                          {(["Hadir", "Izin", "Sakit", "Alpha"] as const).map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() => setStatus(s.id, status)}
                                style={{ width: "1cm" }}
                                className={`px-1 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                                  attendance[date]?.[s.id] === status
                                    ? `${statusColor[status]} text-white`
                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                                }`}
                              >
                                {status}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md transition-colors"
            >
              💾 Simpan Absensi{" "}
              {selectedKelas !== "Semua"
                ? `Kelas ${selectedKelas}`
                : "Semua Kelas"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const MonthlyRecapTab: React.FC<{
  onRefresh: () => void;
  uniqueClasses: string[];
}> = ({ onRefresh, uniqueClasses }) => {
  const [recapData, setRecapData] = useState<MonthlyRecap[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>("Semua");
  const [selectedBulan, setSelectedBulan] = useState<string>("Juni");
  const [loading, setLoading] = useState<boolean>(true);

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ] as const;

  useEffect(() => {
    setLoading(true);
    console.log(
      "Mengambil data rekap dengan kelas:",
      selectedKelas,
      "dan bulan:",
      selectedBulan
    );
    fetch(
      `${endpoint}?action=monthlyRecap&kelas=${
        selectedKelas === "Semua" ? "" : selectedKelas
      }&bulan=${selectedBulan.toLowerCase()}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Respons data rekap:", data);
        if (data.success) {
          setRecapData(data.data || []);
        } else {
          alert("❌ Gagal memuat data rekap: " + data.message);
          setRecapData([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetch:", error);
        alert("❌ Gagal memuat data rekap. Cek console untuk detail.");
        setRecapData([]);
        setLoading(false);
      });
  }, [selectedKelas, selectedBulan, onRefresh]);

  const filteredRecapData = React.useMemo(() => {
    if (selectedKelas === "Semua") {
      return recapData;
    }
    console.log("Menyaring data rekap untuk kelas:", selectedKelas);
    return recapData.filter((item) => {
      const itemKelas = String(item.kelas).trim();
      const result = itemKelas === selectedKelas;
      console.log("Kelas item:", itemKelas, "cocok?", result);
      return result;
    });
  }, [recapData, selectedKelas]);

  const getStatusSummary = () => {
    const summary: StatusSummary = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
    filteredRecapData.forEach((item) => {
      summary.Hadir += item.hadir || 0;
      summary.Alpha += item.alpa || 0;
      summary.Izin += item.izin || 0;
      summary.Sakit += item.sakit || 0;
    });
    return summary;
  };

  const statusSummary = getStatusSummary();

  const downloadExcel = () => {
    const headers = [
      "Nama",
      "Kelas",
      "Hadir",
      "Alpha",
      "Izin",
      "Sakit",
      "% Hadir",
    ];
    const data = [
      headers,
      ...filteredRecapData.map((item) => [
        item.nama || "N/A",
        item.kelas || "N/A",
        item.hadir || 0,
        item.alpa || 0,
        item.izin || 0,
        item.sakit || 0,
        item.persenHadir !== undefined ? `${item.persenHadir}%` : "N/A",
      ]),
      [
        "TOTAL",
        "",
        statusSummary.Hadir,
        statusSummary.Alpha,
        statusSummary.Izin,
        statusSummary.Sakit,
        "",
      ],
      [
        "PERSEN",
        "",
        `${(
          (statusSummary.Hadir /
            (statusSummary.Hadir +
              statusSummary.Alpha +
              statusSummary.Izin +
              statusSummary.Sakit)) *
          100
        ).toFixed(2)}%`,
        `${(
          (statusSummary.Alpha /
            (statusSummary.Hadir +
              statusSummary.Alpha +
              statusSummary.Izin +
              statusSummary.Sakit)) *
          100
        ).toFixed(2)}%`,
        `${(
          (statusSummary.Izin /
            (statusSummary.Hadir +
              statusSummary.Alpha +
              statusSummary.Izin +
              statusSummary.Sakit)) *
          100
        ).toFixed(2)}%`,
        `${(
          (statusSummary.Sakit /
            (statusSummary.Hadir +
              statusSummary.Alpha +
              statusSummary.Izin +
              statusSummary.Sakit)) *
          100
        ).toFixed(2)}%`,
        "",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = headers.map(() => ({ wch: 15 }));
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "FFFF00" } },
      alignment: { horizontal: "center" },
    };
    const totalStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "D3D3D3" } },
      alignment: { horizontal: "center" },
    };
    const percentStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "D3D3D3" } },
      alignment: { horizontal: "center" },
    };
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      ws[cellAddress] = { ...ws[cellAddress], s: headerStyle };
    });
    const totalRow = filteredRecapData.length + 1;
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col, idx) => {
      const cellAddress = `${col}${totalRow}`;
      ws[cellAddress] = { ...ws[cellAddress], s: totalStyle };
    });
    const percentRow = filteredRecapData.length + 2;
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col, idx) => {
      const cellAddress = `${col}${percentRow}`;
      ws[cellAddress] = { ...ws[cellAddress], s: percentStyle };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Bulanan");

    const date = new Date()
      .toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/ /g, "_")
      .replace(/:/g, "-");
    const fileName = `Rekap_Bulanan_${selectedBulan}_${selectedKelas}_${date}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const headers = [
      "Nama",
      "Kelas",
      "Hadir",
      "Alpha",
      "Izin",
      "Sakit",
      "% Hadir",
    ];
    const body = filteredRecapData.map((item) => [
      item.nama || "N/A",
      item.kelas || "N/A",
      item.hadir || 0,
      item.alpa || 0,
      item.izin || 0,
      item.sakit || 0,
      item.persenHadir !== undefined ? `${item.persenHadir}%` : "N/A",
    ]);

    const totalRow = [
      "TOTAL",
      "",
      statusSummary.Hadir,
      statusSummary.Alpha,
      statusSummary.Izin,
      statusSummary.Sakit,
      "",
    ];

    const percentRow = [
      "PERSEN",
      "",
      `${(
        (statusSummary.Hadir /
          (statusSummary.Hadir +
            statusSummary.Alpha +
            statusSummary.Izin +
            statusSummary.Sakit)) *
        100
      ).toFixed(2)}%`,
      `${(
        (statusSummary.Alpha /
          (statusSummary.Hadir +
            statusSummary.Alpha +
            statusSummary.Izin +
            statusSummary.Sakit)) *
        100
      ).toFixed(2)}%`,
      `${(
        (statusSummary.Izin /
          (statusSummary.Hadir +
            statusSummary.Alpha +
            statusSummary.Izin +
            statusSummary.Sakit)) *
        100
      ).toFixed(2)}%`,
      `${(
        (statusSummary.Sakit /
          (statusSummary.Hadir +
            statusSummary.Alpha +
            statusSummary.Izin +
            statusSummary.Sakit)) *
        100
      ).toFixed(2)}%`,
      "",
    ];

    doc.text(
      `Rekap Absensi Bulan ${selectedBulan} Kelas ${selectedKelas}`,
      14,
      10
    );

    autoTable(doc, {
      head: [headers],
      body: [...body, totalRow, percentRow],
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [255, 255, 0], textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
      },
    });

    const date = new Date()
      .toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/ /g, "_")
      .replace(/:/g, "-");
    const fileName = `Rekap_Bulanan_${selectedBulan}_${selectedKelas}_${date}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="max-w-4xl mx-auto" style={{ paddingBottom: "70px" }}>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          📊 Rekap Absensi Bulanan
        </h2>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Filter Kelas</p>
            <select
              value={selectedKelas}
              onChange={(e) => {
                console.log("Mengubah filter kelas ke:", e.target.value);
                setSelectedKelas(e.target.value);
              }}
              className="border border-gray-300 rounded-lg px-1 py-0.5 shadow-sm bg-white min-w-32"
            >
              {uniqueClasses.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Pilih Bulan</p>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="border border-gray-300 rounded-lg px-1 py-0.5 shadow-sm bg-white min-w-32"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-green-600 font-bold text-lg">
              {statusSummary.Hadir}
            </div>
            <div className="text-green-700 text-sm">Hadir</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-yellow-600 font-bold text-lg">
              {statusSummary.Izin}
            </div>
            <div className="text-yellow-700 text-sm">Izin</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-blue-600 font-bold text-lg">
              {statusSummary.Sakit}
            </div>
            <div className="text-blue-700 text-sm">Sakit</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-red-600 font-bold text-lg">
              {statusSummary.Alpha}
            </div>
            <div className="text-red-700 text-sm">Alpha</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={downloadExcel}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            📥 Download Excel
          </button>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            📄 Download PDF
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Memuat rekap...</p>
          </div>
        ) : filteredRecapData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Tidak ada data rekap untuk {selectedBulan} kelas {selectedKelas}.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Coba pilih kelas atau bulan lain.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-1 py-0.5 text-left text-sm font-semibold text-gray-700">
                    Nama
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-left text-sm font-semibold text-gray-700">
                    Kelas
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-center text-sm font-semibold text-gray-700">
                    Hadir
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-center text-sm font-semibold text-gray-700">
                    Alpha
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-center text-sm font-semibold text-gray-700">
                    Izin
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-center text-sm font-semibold text-gray-700">
                    Sakit
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-center text-sm font-semibold text-gray-700">
                    % Hadir
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecapData.map((item, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-200 px-1 py-0.5 text-sm text-gray-600">
                      {item.nama || "N/A"}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-sm text-gray-600">
                      {item.kelas || "N/A"}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center text-sm text-gray-600">
                      {item.hadir || 0}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center text-sm text-gray-600">
                      {item.alpa || 0}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center text-sm text-gray-600">
                      {item.izin || 0}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center text-sm text-gray-600">
                      {item.sakit || 0}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center text-sm text-gray-600">
                      {item.persenHadir !== undefined
                        ? `${item.persenHadir}%`
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const GraphTab: React.FC<{
  uniqueClasses: string[];
}> = ({ uniqueClasses }) => {
  const [graphData, setGraphData] = useState<GraphData>({
    Januari: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    Februari: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    Maret: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    April: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    Mei: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    Juni: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    Juli: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    Agustus: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    September: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    Oktober: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    November: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
    Desember: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
  });
  const [selectedKelas, setSelectedKelas] = useState<string>(
    uniqueClasses.length > 0 ? uniqueClasses[0] : "Tidak Ada"
  );
  const [selectedSemester, setSelectedSemester] = useState<"1" | "2">("2");
  const [statusVisibility, setStatusVisibility] = useState<StatusVisibility>({
    Hadir: true,
    Alpha: true,
    Izin: true,
    Sakit: true,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const uniqueClassesWithDefault = React.useMemo(() => {
    return ["Tidak Ada", ...uniqueClasses.filter((kelas) => kelas !== "Semua")];
  }, [uniqueClasses]);

  useEffect(() => {
    setLoading(true);
    fetch(
      `${endpoint}?action=graphData&kelas=${
        selectedKelas === "Tidak Ada" ? "" : selectedKelas
      }&semester=${selectedSemester}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setGraphData(data.data || {});
        } else {
          alert("❌ Gagal memuat data grafik: " + data.message);
          setGraphData({
            Januari: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            Februari: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            Maret: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            April: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            Mei: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            Juni: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            Juli: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            Agustus: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            September: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            Oktober: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            November: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
            Desember: { Hadir: 0, Alpha: 0, Izin: 0, Sakit: 0 },
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetch:", error);
        alert("❌ Gagal memuat data grafik. Cek console untuk detail.");
        setLoading(false);
      });
  }, [selectedKelas, selectedSemester]);

  const semesterMonths: Record<"1" | "2", string[]> = {
    "1": ["Juli", "Agustus", "September", "Oktober", "November", "Desember"],
    "2": ["Januari", "Februari", "Maret", "April", "Mei", "Juni"],
  };

  const chartData: ChartData<"bar", number[], string> = {
    labels: semesterMonths[selectedSemester],
    datasets: [
      ...(statusVisibility.Hadir
        ? [
            {
              label: "Hadir",
              data: semesterMonths[selectedSemester].map(
                (month: string) => graphData[month]?.Hadir || 0
              ),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ]
        : []),
      ...(statusVisibility.Alpha
        ? [
            {
              label: "Alpha",
              data: semesterMonths[selectedSemester].map(
                (month: string) => graphData[month]?.Alpha || 0
              ),
              backgroundColor: "rgba(255, 99, 132, 0.6)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
            },
          ]
        : []),
      ...(statusVisibility.Izin
        ? [
            {
              label: "Izin",
              data: semesterMonths[selectedSemester].map(
                (month: string) => graphData[month]?.Izin || 0
              ),
              backgroundColor: "rgba(255, 205, 86, 0.6)",
              borderColor: "rgba(255, 205, 86, 1)",
              borderWidth: 1,
            },
          ]
        : []),
      ...(statusVisibility.Sakit
        ? [
            {
              label: "Sakit",
              data: semesterMonths[selectedSemester].map(
                (month: string) => graphData[month]?.Sakit || 0
              ),
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ]
        : []),
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        onClick: (
          e: ChartEvent,
          legendItem: LegendItem,
          legend: {
            chart: {
              data: { datasets: { hidden?: boolean }[] };
              update: () => void;
            };
          }
        ) => {
          const index = legendItem.datasetIndex;
          if (index !== undefined) {
            const ci = legend.chart.data.datasets[index];
            ci.hidden = !ci.hidden;
            legend.chart.update();
            setStatusVisibility((prev) => ({
              ...prev,
              [legendItem.text as keyof StatusVisibility]: !ci.hidden,
            }));
          }
        },
      },
      title: {
        display: true,
        text: `Persentase Kehadiran Kelas ${selectedKelas} Semester ${selectedSemester} 2025`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 10,
          font: {
            size: 10,
          },
          autoSkip: false,
          maxTicksLimit: 11,
        },
        title: { display: true, text: "Persentase (%)" },
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  };

  const handleStatusToggle = (status: keyof StatusVisibility) => {
    setStatusVisibility((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto" style={{ paddingBottom: "70px" }}>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          📈 Grafik Kehadiran
        </h2>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Filter Kelas</p>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="border border-gray-300 rounded-lg px-1 py-0.5 shadow-sm bg-white min-w-32"
            >
              {uniqueClassesWithDefault.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Filter Semester</p>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as "1" | "2")}
              className="border border-gray-300 rounded-lg px-1 py-0.5 shadow-sm bg-white min-w-32"
            >
              <option value="1">Semester 1 (Juli-Des)</option>
              <option value="2">Semester 2 (Jan-Jun)</option>
            </select>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          {(["Hadir", "Alpha", "Izin", "Sakit"] as const).map((status) => (
            <label key={status} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={statusVisibility[status]}
                onChange={() => handleStatusToggle(status)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">{status}</span>
            </label>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Memuat grafik...</p>
          </div>
        ) : selectedKelas === "Tidak Ada" ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Tidak ada data untuk ditampilkan.</p>
          </div>
        ) : (
          <div
            className="h-96"
            style={{
              minHeight: "300px",
              maxHeight: "500px",
            }}
          >
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceHistoryTab: React.FC<{
  students: Student[];
  uniqueClasses: string[];
}> = ({ students, uniqueClasses }) => {
  const [historyData, setHistoryData] = useState<AttendanceHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedKelas, setSelectedKelas] = useState<string>("Semua");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [editingRecord, setEditingRecord] = useState<AttendanceHistory | null>(
    null
  );

  useEffect(() => {
    setLoading(true);
    fetch(`${endpoint}?action=attendanceHistory`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setHistoryData(data.data || []);
        } else {
          alert("❌ Gagal memuat riwayat absensi: " + data.message);
          setHistoryData([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetch:", error);
        alert("❌ Gagal memuat riwayat absensi. Cek console untuk detail.");
        setHistoryData([]);
        setLoading(false);
      });
  }, []);

  const filteredHistory = React.useMemo(() => {
    return historyData.filter((record) => {
      const matchesKelas =
        selectedKelas === "Semua" || record.kelas === selectedKelas;
      const matchesDate = !selectedDate || record.tanggal === selectedDate;
      return matchesKelas && matchesDate;
    });
  }, [historyData, selectedKelas, selectedDate]);

  const uniqueDates = React.useMemo(() => {
    const dates = new Set(historyData.map((record) => record.tanggal));
    return ["Semua", ...Array.from(dates).sort()];
  }, [historyData]);

  const handleEdit = (record: AttendanceHistory) => {
    setEditingRecord(record);
  };

  const handleUpdate = () => {
    if (!editingRecord) return;
    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "updateAttendance",
        tanggal: editingRecord.tanggal,
        nisn: editingRecord.nisn,
        status: editingRecord.status,
      }),
    })
      .then(() => {
        alert("✅ Status absensi berhasil diperbarui");
        setEditingRecord(null);
        fetch(`${endpoint}?action=attendanceHistory`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) setHistoryData(data.data || []);
          });
      })
      .catch(() => alert("❌ Gagal memperbarui status absensi"));
  };

  const handleDeleteAll = () => {
    if (
      confirm(
        "⚠️ Yakin ingin menghapus SEMUA data absensi? Tindakan ini tidak dapat dibatalkan!"
      )
    ) {
      fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "deleteAllAttendance" }),
      })
        .then(() => {
          alert("🗑️ Semua data absensi berhasil dihapus");
          setHistoryData([]);
        })
        .catch(() => alert("❌ Gagal menghapus semua data absensi"));
    }
  };

  return (
    <div className="max-w-4xl mx-auto" style={{ paddingBottom: "70px" }}>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          📜 Riwayat Absensi
        </h2>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Filter Kelas</p>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="border border-gray-300 rounded-lg px-1 py-0.5 shadow-sm bg-white min-w-32"
            >
              {uniqueClasses.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Filter Tanggal</p>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-1 py-0.5 shadow-sm bg-white min-w-32"
            >
              {uniqueDates.map((date) => (
                <option key={date} value={date}>
                  {date === "Semua" ? "Semua Tanggal" : date}
                </option>
              ))}
            </select>
          </div>
          <div className="text-center">
            <button
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              🗑️ Hapus Semua
            </button>
          </div>
        </div>

        {editingRecord && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">
              Edit Absensi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  Nama: {editingRecord.nama}
                </p>
                <p className="text-sm text-gray-600">
                  NISN: {editingRecord.nisn}
                </p>
                <p className="text-sm text-gray-600">
                  Kelas: {editingRecord.kelas}
                </p>
                <p className="text-sm text-gray-600">
                  Tanggal: {editingRecord.tanggal}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Status</p>
                <select
                  value={editingRecord.status}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      status: e.target.value as AttendanceStatus,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {(["Hadir", "Izin", "Sakit", "Alpha"] as const).map(
                    (status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                💾 Simpan
              </button>
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
              >
                ❌ Batal
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Memuat riwayat absensi...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Tidak ada data absensi untuk kelas {selectedKelas}{" "}
              {selectedDate !== "Semua" ? `tanggal ${selectedDate}` : ""}.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Coba pilih kelas atau tanggal lain.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-1 py-0.5 text-left text-sm font-semibold text-gray-700">
                    Tanggal
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-left text-sm font-semibold text-gray-700">
                    Nama
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-left text-sm font-semibold text-gray-700">
                    Kelas
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-left text-sm font-semibold text-gray-700">
                    NISN
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-center text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="border border-gray-200 px-1 py-0.5 text-center text-sm font-semibold text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((record, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-200 px-1 py-0.5 text-sm text-gray-600">
                      {record.tanggal}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-sm text-gray-600">
                      {record.nama}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-sm text-gray-600">
                      {record.kelas}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-sm text-gray-600">
                      {record.nisn}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center text-sm text-gray-600">
                      {record.status}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center text-sm">
                      <button
                        onClick={() => handleEdit(record)}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StudentAttendanceApp: React.FC<{ onLogout: () => void }> = ({
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    "data" | "absensi" | "rekap" | "grafik" | "riwayat"
  >("data");
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Data siswa diterima:", data);
        setStudents(data);
      })
      .catch((error) => {
        console.error("Error fetch:", error);
        alert("❌ Gagal memuat data siswa. Cek console untuk detail.");
      });
  }, [refreshTrigger]);

  const uniqueClasses = React.useMemo(() => {
    const classes = new Set<string>();
    students.forEach((student) => {
      if (student.kelas) classes.add(String(student.kelas).trim());
    });
    return ["Semua", ...Array.from(classes).sort()];
  }, [students]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabChange = (
    tab: "data" | "absensi" | "rekap" | "grafik" | "riwayat"
  ) => {
    setActiveTab(tab);
    if (isSidebarOpen) {
      setIsSidebarOpen(false); // Tutup sidebar otomatis saat memilih tab
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-blue-800 text-white transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">Absensi Siswa</h1>
          <button
            onClick={toggleSidebar}
            className="text-white text-xl font-bold hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <nav className="mt-4">
          <button
            onClick={() => handleTabChange("data")}
            className={`w-full text-left p-4 hover:bg-blue-700 ${
              activeTab === "data" ? "bg-blue-900" : ""
            }`}
          >
            📋 Data Siswa
          </button>
          <button
            onClick={() => handleTabChange("absensi")}
            className={`w-full text-left p-4 hover:bg-blue-700 ${
              activeTab === "absensi" ? "bg-blue-900" : ""
            }`}
          >
            ✅ Absensi
          </button>
          <button
            onClick={() => handleTabChange("rekap")}
            className={`w-full text-left p-4 hover:bg-blue-700 ${
              activeTab === "rekap" ? "bg-blue-900" : ""
            }`}
          >
            📊 Rekap Bulanan
          </button>
          <button
            onClick={() => handleTabChange("grafik")}
            className={`w-full text-left p-4 hover:bg-blue-700 ${
              activeTab === "grafik" ? "bg-blue-900" : ""
            }`}
          >
            📈 Grafik Absensi
          </button>
          <button
            onClick={() => handleTabChange("riwayat")}
            className={`w-full text-left p-4 hover:bg-blue-700 ${
              activeTab === "riwayat" ? "bg-blue-900" : ""
            }`}
          >
            📜 Riwayat Absensi
          </button>
          <button
            onClick={() => {
              onLogout();
              if (isSidebarOpen) {
                setIsSidebarOpen(false); // Tutup sidebar otomatis saat logout
              }
            }}
            className="w-full text-left p-4 hover:bg-red-700 bg-red-600"
          >
            🚪 Logout
          </button>
        </nav>
      </div>
      <div
        className={`flex-1 p-4 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        )}
        {activeTab === "data" && (
          <StudentDataTab
            students={students}
            onRefresh={handleRefresh}
            uniqueClasses={uniqueClasses}
          />
        )}
        {activeTab === "absensi" && (
          <AttendanceTab students={students} onRecapRefresh={handleRefresh} />
        )}
        {activeTab === "rekap" && (
          <MonthlyRecapTab
            onRefresh={handleRefresh}
            uniqueClasses={uniqueClasses}
          />
        )}
        {activeTab === "grafik" && <GraphTab uniqueClasses={uniqueClasses} />}
        {activeTab === "riwayat" && (
          <AttendanceHistoryTab
            students={students}
            uniqueClasses={uniqueClasses}
          />
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem("isAuthenticated") === "true"
  );

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
  };

  return isAuthenticated ? (
    <StudentAttendanceApp onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
};

export default App;
