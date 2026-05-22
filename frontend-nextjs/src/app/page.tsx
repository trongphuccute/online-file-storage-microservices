const services = [
  { name: "Auth Service", url: "http://localhost:8001/api/health/" },
  { name: "File Service", url: "http://localhost:8002/api/health/" },
  { name: "Share Service", url: "http://localhost:8003/api/health/" },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-teal-700">Cloud Computing Microservices</p>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
              Online File Storage
            </h1>
          </div>
          <a
            href="/"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          >
            Dashboard
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Quan ly file</h2>
              <p className="mt-1 text-sm text-slate-600">
                Upload, download, chia se link va theo doi quota dung luong.
              </p>
            </div>
            <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white">
              Upload
            </button>
          </div>

          <div className="grid gap-3">
            {["Bao cao.pdf", "Anh-demo.png", "Slide-demo.pptx"].map((file) => (
              <div
                key={file}
                className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{file}</p>
                  <p className="text-sm text-slate-500">San sang ket noi API File Service</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    Preview
                  </button>
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-950">Trang thai service</h2>
            <div className="mt-4 space-y-3">
              {services.map((service) => (
                <a
                  key={service.name}
                  href={service.url}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-3 text-sm"
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="text-teal-700">health</span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-950">Quota</h2>
            <div className="mt-4 h-2 rounded-full bg-slate-200">
              <div className="h-2 w-1/3 rounded-full bg-teal-700" />
            </div>
            <p className="mt-3 text-sm text-slate-600">Demo UI: 0.33 GB / 1 GB</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
