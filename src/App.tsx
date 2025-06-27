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
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const endpoint =
  "https://script.google.com/macros/s/AKfycbz0rICuH8L-9VI3ysBIwtZA6BzxiHck_txmqwTApuNk19hHpnY40vMAi2J7aXq7sFjj/exec";

interface Student {
  id: string;
  name: string;
  nisn: string;
  kelas: string;
}

type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpha";
interface AttendanceRecord {
  [date: string]: {
    [studentId: string]: string;
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

const formatDateDDMMYYYY = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
};

const StudentDataTab: React.FC<{
  students: Student[];
  onRefresh: () => void;
}> = ({ students, onRefresh }) => {
  const [nisn, setNisn] = useState("");
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("");

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
    const newNisn = prompt("Edit NISN:", student.nisn);
    const newName = prompt("Edit nama siswa:", student.name);
    const newClass = prompt("Edit kelas siswa:", student.kelas);

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

  const handleDeleteStudent = (nisn: string) => {
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

  return (
    <div className="max-w-4xl mx-auto">
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

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Daftar Siswa ({students.length})
        </h3>
        {students.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Belum ada data siswa.
          </p>
        ) : (
          <div className="space-y-3">
            {students.map((s) => (
              <div
                key={s.id}
                className="flex justify-between items-center bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">{s.name}</p>
                  <p className="text-sm text-gray-600">
                    NISN: {s.nisn} | Kelas: {s.kelas}
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
      const init: { [key: string]: string } = {};
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
      nama: s.name,
      kelas: s.kelas,
      nisn: s.nisn,
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

  const getAttendanceSummary = () => {
    const summary = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
    filteredStudents.forEach((s) => {
      const status = attendance[date]?.[s.id] || "Hadir";
      summary[status as AttendanceStatus]++;
    });
    return summary;
  };

  const attendanceSummary = getAttendanceSummary();

  return (
    <div className="max-w-4xl mx-auto">
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
              className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm"
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
              className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm bg-white min-w-32"
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
              className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg"
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
                          • {s.name} (NISN: {s.nisn}, Kelas: {s.kelas})
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
                    {idx + 1}. {s.name} | Kelas: "{s.kelas}" (type:{" "}
                    {typeof s.kelas})
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

            <div className="space-y-4 mb-6">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-800">
                        {s.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Kelas {s.kelas} • NISN: {s.nisn}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(
                        [
                          "Hadir",
                          "Izin",
                          "Sakit",
                          "Alpha",
                        ] as AttendanceStatus[]
                      ).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatus(s.id, status)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            attendance[date]?.[s.id] === status
                              ? `${statusColor[status]} text-white`
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
  const [selectedBulan, setSelectedBulan] = useState<string>("Januari");
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
  ];

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
    const summary = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
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
      if (!ws[cellAddress]) ws[cellAddress] = {};
      ws[cellAddress].s = headerStyle;
    });
    const totalRow = filteredRecapData.length + 1;
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col, idx) => {
      const cellAddress = `${col}${totalRow}`;
      if (!ws[cellAddress]) ws[cellAddress] = {};
      ws[cellAddress].s = totalStyle;
    });
    const percentRow = filteredRecapData.length + 2;
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col, idx) => {
      const cellAddress = `${col}${percentRow}`;
      if (!ws[cellAddress]) ws[cellAddress] = {};
      ws[cellAddress].s = percentStyle;
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
    const totalAttendance =
      statusSummary.Hadir +
      statusSummary.Alpha +
      statusSummary.Izin +
      statusSummary.Sakit;
    const data = [
      ...filteredRecapData.map((item) => [
        item.nama || "T/A",
        item.kelas || "T/A",
        item.hadir || 0,
        item.alpa || 0,
        item.izin || 0,
        item.sakit || 0,
        item.persenHadir !== undefined ? `${item.persenHadir}%` : "T/A",
      ]),
      // Baris Total
      [
        "TOTAL",
        "",
        statusSummary.Hadir,
        statusSummary.Alpha,
        statusSummary.Izin,
        statusSummary.Sakit,
        "",
      ],
      // Baris Persentase
      [
        "PERSEN",
        "",
        totalAttendance > 0
          ? `${((statusSummary.Hadir / totalAttendance) * 100).toFixed(1)}%`
          : "0%",
        totalAttendance > 0
          ? `${((statusSummary.Alpha / totalAttendance) * 100).toFixed(1)}%`
          : "0%",
        totalAttendance > 0
          ? `${((statusSummary.Izin / totalAttendance) * 100).toFixed(1)}%`
          : "0%",
        totalAttendance > 0
          ? `${((statusSummary.Sakit / totalAttendance) * 100).toFixed(1)}%`
          : "0%",
        "",
      ],
    ];

    // Tambahkan judul
    doc.text(
      `REKAP ABSENSI SISWA KELAS ${selectedKelas} ${selectedBulan.toUpperCase()} 2025`,
      doc.internal.pageSize.getWidth() / 2,
      15,
      { align: "center" }
    );
    doc.setFontSize(12);

    // Buat tabel tunggal dengan semua data
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 25,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 0], // Kuning untuk header
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineColor: [0, 0, 0], // Garis batas hitam untuk header
        lineWidth: 0.1, // Ketebalan garis batas
      },
      styles: {
        cellPadding: 2,
        fontSize: 10,
        halign: "center",
        lineColor: [0, 0, 0], // Garis batas hitam untuk seluruh tabel
        lineWidth: 0.1, // Ketebalan garis batas
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 },
      },
      margin: { left: 30, right: 15 },
      tableWidth: "auto",
      horizontalPageBreak: true,
      // Gaya untuk baris total dan persentase
      didParseCell: (data) => {
        if (data.row.index === filteredRecapData.length) {
          // Baris Total
          data.cell.styles.fillColor = [240, 240, 240]; // Abu-abu muda
          data.cell.styles.fontStyle = "bold";
        } else if (data.row.index === filteredRecapData.length + 1) {
          // Baris Persentase
          data.cell.styles.fillColor = [240, 240, 240]; // Abu-abu muda
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Tambahkan tanda tangan
    const finalY = (doc as any).lastAutoTable.finalY || 25;
    doc.text("Mengetahui,", 15, finalY + 20);
    doc.text("Kepala Sekolah", 15, finalY + 30);
    doc.text("NIP: 1975091220001014", 15, finalY + 40);
    doc.text(
      `Makassar, ${new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}`,
      doc.internal.pageSize.getWidth() - 50,
      finalY + 20
    );
    doc.text("Guru Kelas", doc.internal.pageSize.getWidth() - 50, finalY + 30);
    doc.text(
      "Herlita, S.Pd",
      doc.internal.pageSize.getWidth() - 50,
      finalY + 40
    );
    doc.text(
      "NIP: 1990081020202212",
      doc.internal.pageSize.getWidth() - 50,
      finalY + 50
    );

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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          📊 Rekap Bulanan
        </h2>

        <div className="mb-6 text-center flex flex-col md:flex-row gap-4 items-center justify-center">
          <div>
            <p className="text-sm text-gray-500 mb-2">Filter Bulan</p>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm bg-white min-w-32"
            >
              {months.map((bulan) => (
                <option key={bulan} value={bulan}>
                  {bulan}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Filter Kelas</p>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm bg-white min-w-32"
            >
              {uniqueClasses.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : filteredRecapData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Tidak ada data rekap untuk ditampilkan untuk bulan "
              {selectedBulan}" dan kelas "{selectedKelas}".
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Periksa apakah data tersedia di sheet "{selectedBulan}".
            </p>
          </div>
        ) : (
          <>
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

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-3 border">Nama</th>
                    <th className="p-3 border">Kelas</th>
                    <th className="p-3 border">Hadir</th>
                    <th className="p-3 border">Alpha</th>
                    <th className="p-3 border">Izin</th>
                    <th className="p-3 border">Sakit</th>
                    <th className="p-3 border">% Hadir</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecapData.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.nama || "N/A"}</td>
                      <td className="p-3">{item.kelas || "N/A"}</td>
                      <td className="p-3">{item.hadir || 0}</td>
                      <td className="p-3">{item.alpa || 0}</td>
                      <td className="p-3">{item.izin || 0}</td>
                      <td className="p-3">{item.sakit || 0}</td>
                      <td className="p-3">
                        {item.persenHadir !== undefined
                          ? `${item.persenHadir}%`
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={downloadExcel}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium mr-2"
              >
                📥 Unduh Rekap sebagai Excel
              </button>
              <button
                onClick={downloadPDF}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                📥 Unduh Rekap sebagai PDF
              </button>
            </div>
          </>
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
  const [selectedKelas, setSelectedKelas] = useState<string>("Semua");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(
      `${endpoint}?action=graphData&kelas=${
        selectedKelas === "Semua" ? "" : selectedKelas
      }`
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
  }, [selectedKelas]);

  const chartData = {
    labels: [
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
    ],
    datasets: [
      {
        label: "Hadir",
        data: [
          graphData.Januari.Hadir,
          graphData.Februari.Hadir,
          graphData.Maret.Hadir,
          graphData.April.Hadir,
          graphData.Mei.Hadir,
          graphData.Juni.Hadir,
          graphData.Juli.Hadir,
          graphData.Agustus.Hadir,
          graphData.September.Hadir,
          graphData.Oktober.Hadir,
          graphData.November.Hadir,
          graphData.Desember.Hadir,
        ],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Alpha",
        data: [
          graphData.Januari.Alpha,
          graphData.Februari.Alpha,
          graphData.Maret.Alpha,
          graphData.April.Alpha,
          graphData.Mei.Alpha,
          graphData.Juni.Alpha,
          graphData.Juli.Alpha,
          graphData.Agustus.Alpha,
          graphData.September.Alpha,
          graphData.Oktober.Alpha,
          graphData.November.Alpha,
          graphData.Desember.Alpha,
        ],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Izin",
        data: [
          graphData.Januari.Izin,
          graphData.Februari.Izin,
          graphData.Maret.Izin,
          graphData.April.Izin,
          graphData.Mei.Izin,
          graphData.Juni.Izin,
          graphData.Juli.Izin,
          graphData.Agustus.Izin,
          graphData.September.Izin,
          graphData.Oktober.Izin,
          graphData.November.Izin,
          graphData.Desember.Izin,
        ],
        backgroundColor: "rgba(255, 205, 86, 0.6)",
        borderColor: "rgba(255, 205, 86, 1)",
        borderWidth: 1,
      },
      {
        label: "Sakit",
        data: [
          graphData.Januari.Sakit,
          graphData.Februari.Sakit,
          graphData.Maret.Sakit,
          graphData.April.Sakit,
          graphData.Mei.Sakit,
          graphData.Juni.Sakit,
          graphData.Juli.Sakit,
          graphData.Agustus.Sakit,
          graphData.September.Sakit,
          graphData.Oktober.Sakit,
          graphData.November.Sakit,
          graphData.Desember.Sakit,
        ],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const }, // Gunakan 'as const' untuk tipe literal
      title: {
        display: true,
        text: `Persentase Kehadiran Kelas ${selectedKelas} 2025`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: "Persentase (%)" },
      },
    },
  } as const; // Opsional, tambahkan ini untuk seluruh objek jika diperlukan

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          📈 Grafik Kehadiran
        </h2>

        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Filter Kelas</p>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm bg-white min-w-32"
          >
            {uniqueClasses.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Memuat grafik...</p>
          </div>
        ) : (
          <div className="h-96">
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

const StudentAttendanceApp: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [uniqueClasses, setUniqueClasses] = useState<string[]>(["Semua"]);
  const [activeTab, setActiveTab] = useState<
    "data" | "attendance" | "recap" | "graph"
  >("data");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchStudents = () => {
    fetch(endpoint)
      .then((res) => res.json())
      .then((data: Student[]) => {
        console.log("Data siswa yang diambil:", data);
        setStudents(data);

        const classSet = new Set<string>();
        data.forEach((student) => {
          if (student.kelas != null) {
            const kelasValue = String(student.kelas).trim();
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
          if (aIsNum && bIsNum) return parseInt(a) - parseInt(b);
          if (aIsNum && !bIsNum) return -1;
          if (!aIsNum && bIsNum) return 1;
          return a.localeCompare(b);
        });
        setUniqueClasses(["Semua", ...classes]);
      })
      .catch((error) => {
        console.error("Error fetch:", error);
        alert("❌ Gagal mengambil data siswa. Cek console untuk detail.");
      });
  };

  const handleRecapRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistem Absensi Siswa
          </h1>
          <p className="text-gray-600">Kelola data siswa dan absensi harian</p>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("data")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "data"
                  ? "bg-blue-600 text-white border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              👥 Data Siswa
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "attendance"
                  ? "bg-blue-600 text-white border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              📋 Absensi
            </button>
            <button
              onClick={() => setActiveTab("recap")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "recap"
                  ? "bg-blue-600 text-white border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              📊 Rekap Bulanan
            </button>
            <button
              onClick={() => setActiveTab("graph")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "graph"
                  ? "bg-blue-600 text-white border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              📈 Grafik
            </button>
          </div>
        </div>

        <div className="py-4">
          {activeTab === "data" ? (
            <StudentDataTab students={students} onRefresh={fetchStudents} />
          ) : activeTab === "attendance" ? (
            <AttendanceTab
              students={students}
              onRecapRefresh={handleRecapRefresh}
            />
          ) : activeTab === "recap" ? (
            <MonthlyRecapTab
              onRefresh={handleRecapRefresh}
              uniqueClasses={uniqueClasses}
            />
          ) : (
            <GraphTab uniqueClasses={uniqueClasses} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceApp;
