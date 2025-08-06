import React from 'react';

const UserGuide = () => {
  const depreciationRates = [
    {
      category: 'I. Bukan Bangunan',
      group: 'Kelompok 1',
      lifespan: '4 tahun',
      straightLine: '25%',
      declining: '50%'
    },
    {
      category: 'I. Bukan Bangunan',
      group: 'Kelompok 2',
      lifespan: '8 tahun',
      straightLine: '12,5%',
      declining: '25%'
    },
    {
      category: 'I. Bukan Bangunan',
      group: 'Kelompok 3',
      lifespan: '16 tahun',
      straightLine: '6,25%',
      declining: '12,5%'
    },
    {
      category: 'I. Bukan Bangunan',
      group: 'Kelompok 4',
      lifespan: '20 tahun',
      straightLine: '5%',
      declining: '10%'
    },
    {
      category: 'II. Bangunan',
      group: 'Tidak Permanen',
      lifespan: '10 tahun',
      straightLine: '10%',
      declining: '-'
    },
    {
      category: 'II. Bangunan',
      group: 'Permanen',
      lifespan: '20 tahun',
      straightLine: '5%',
      declining: '-'
    }
  ];

  const groupedRates = depreciationRates.reduce((acc, rate) => {
    if (!acc[rate.category]) {
      acc[rate.category] = [];
    }
    acc[rate.category].push(rate);
    return acc;
  }, {});

  const TableComponent = ({ rates, title }) => (
    <div className="mb-8">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Kelompok Harta Berwujud
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Masa Manfaat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tarif - Metode Garis Lurus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tarif - Metode Saldo Menurun
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rates.map((rate, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {rate.group}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {rate.lifespan}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {rate.straightLine}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {rate.declining}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const assetGroups = [
    {
      category: 'I. Bukan Bangunan',
      group: 'Kelompok 1',
      assets: [
        {
          industry: 'Semua Jenis Usaha',
          items: [
            'Mebel kayu/rotan (meja, bangku, kursi, lemari)',
            'Mesin kantor (laptop, komputer, printer, scanner)',
            'Perlengkapan elektronik (amplifier, TV, video recorder)',
            'Sepeda motor, sepeda, becak',
            'Alat perlengkapan khusus industri',
            'Alat dapur',
            'Dies, jigs, mould',
            'Alat komunikasi (telepon, faksimile, handphone)'
          ]
        },
        {
          industry: 'Pertanian, Perkebunan, Peternakan, Perikanan',
          items: [
            'Alat yang digerakkan bukan dengan mesin seperti cangkul, garu, dan lain-lain.'
          ]
        },
        {
          industry: 'Industri makanan dan minuman',
          items: [
            'Mesin ringan yang dapat dipindah-pindahkan seperti huler, pemecah kulit, penyosoh, pengering, pallet, dan sejenisnya.'
          ]
        },
        {
          industry: 'Transportasi dan Pergudangan',
          items: [
            'Mobil taksi, bus, dan truk yang digunakan sebagai angkutan umum.'
          ]
        },
        {
          industry: 'Industri Semikonduktor',
          items: [
            'Flash memory tester, writer machine, bipolar test system, elimination (PE8-1), dan pose checker.'
          ]
        },
        {
          industry: 'Jasa Persewaan Peralatan Tambat Air Dalam',
          items: [
            'Anchor, Anchor Chains, Polyester Rope, Steel Buoys, Steel Wire Ropes, dan Mooring Accessoris.'
          ]
        },
        {
          industry: 'Jasa Telekomunikasi Seluler',
          items: [
            'Base Station Controller.'
          ]
        },
      ],
    },
    {
      category: 'I. Bukan Bangunan',
      group: 'Kelompok 2',
      assets: [
        {
          industry: 'Semua Jenis Usaha',
          items: [
            'Mebel dan peralatan dari logam termasuk meja, bangku, kursi, lemari, dan sejenisnya yang bukan merupakan bagian dari bangunan. Alat pengatur udara, seperti AC, kipas angin, dan sejenisnya.',
            'Mobil, bus, truk, speed boat, dan sejenisnya.',
            'Container dan sejenisnya.'
          ]
        },
        {
          industry: 'Pertanian, Perkebunan, Peternakan, Perikanan',
          items: [
            'Mesin pertanian atau perkebunan, seperti traktor dan mesin bajak, penggaruk, penanaman, penebar benih, dan sejenisnya.',
            'Mesin yang mengolah atau menghasilkan atau memproduksi bahan atau barang pertanian, perkebunan, peternakan, dan perikanan.'
          ]
        },
        {
          industry: 'Industri makanan dan minuman',
          items: [
            'Mesin yang mengolah produk asal binatang, unggas dan perikanan, misalnya pabrik susu dan pengalengan ikan.',
            'Mesin yang mengolah produk nabati, misalnya mesin minyak kelapa, margarin, penggilingan kopi, kembang gula, mesin pengolah biji-bijian, seperti penggilingan beras, gandum, tapioka.',
            'Mesin yang menghasilkan atau memproduksi minuman dan bahan-bahan minuman segala jenis',
            'Mesin yang menghasilkan atau memproduksi bahan-bahan makanan dan makanan segala jenis.'
          ]
        },
        {
          industry: 'Industri pengolahan tembakau',
          items: [
            'Mesin yang menghasilkan atau memproduksi hasil olahan tembakau, seperti mesin rajang tembakau, mesin linting rokok, dan sejenisnya.'
          ]
        },
        {
          industry: 'Industri mesin',
          items: [
            'Mesin yang menghasilkan atau memproduksi mesin ringan (misalnya mesin jahit, pompa air).'
          ]
        },
        {
          industry: 'Perkayuan, kehutanan',
          items: [
            'Mesin dan pelalatan penebangan kayu.',
            'Mesin yang mengolah atau menghasilkan atau memproduksi bahan atau barang kehutanan.'
          ]
        },
        {
          industry: 'Konstruksi',
          items: [
            'Peralatan konstruksi yang dipergunakan, seperti truk berat, dump truck, crane buldozer, dan sejenisnya.'
          ]
        },
        {
          industry: 'Transportasi dan Pergudangan',
          items: [
            'Truk kerja untuk pengangkutan dan bongkar muat, truk peron, truk ngangkang, dan sejenisnya.',
            'kapal penumpang, kapal barang, kapal khusus dibuat untuk pengangkutan barang tertentu (misalnya gandum, batu-batuan, biji tambang, dan sebagainya) termasuk kapal pendingin, kapal tangki, kapal penangkap ikan, dan sejenisnya, yang mempunyai berat sampai dengan 100 DWT.',
            'kapal yang dibuat khusus untuk menghela atau mendorong kapal-kapal suar, kapal pemadam kebakaran, kapal keruk, keran terapung, dan sejenisnya yang mempunyai berat sampai dengan 100 DWT',
            'perahu layar pakai atau tanpa motor yang mempunyai berat sampai dengan 250 DWT',
            'kapal balon'
          ]
        },
        {
          industry: 'Telekomunikasi',
          items: [
            'Perangkat pesawat telepon; pesawat telegraf termasuk pesawat pengiriman dan penerimaan radio telegraf dan radio telepon.'
          ]
        },
        {
          industry: 'Industri Semikonduktor',
          items: [
            'Auto Frame Loader, Automatic Logic Handler, Baking Oven, Ball Shear Tester, Bipolar Test Handler (Automatic), Cleaning Machine, Coating Machine, Curing Oven, Cutting Press, Dambar Cut Machine, Dicer, Die Bonder, Die Shear Test, Dynamic Burn-in System Oven, Dynamic Test Handler, Eliminator (PGE-01), Full Automatic Handler, Full Automatic Mark, Hand Maker, Individual Mark, Inserter Remover Machine, Laser Marker (FUM A-01), Logic Test System, Marker (Mark), Memory Test System, Molding, Mounter, MPS Automatic, MPS Manual, O/S Tester Manual, Pass Oven, Pose Checker, Re-form Machine, SMD Stocker, Taping Machine, Tiebar Cut Press, Trimming/Forming Machine, Wire Bonder, Wire Pull Tester.'
          ]
        },
        {
          industry: 'Jasa Persewaan Peralatan Tambat Air Dalam',
          items: [
            'Spooling Machines, Metocean Data Collector.'
          ]
        },
        {
          industry: 'Jasa Telekomunikasi Seluler',
          items: [
            'Mobile Switching Center, Home Location Register, Visitor Location Register, Authentication Center, Equipment Identity Register, Intelligent Network Service Control Point, Intelligent Network Service Management Point, Radio Base Station, Transceiver Unit, Terminal SDH/Mini Link, Antena.'
          ]
        },
      ],
    },
    {
      category: 'I. Bukan Bangunan',
      group: 'Kelompok 3',
      assets: [
        {
          industry: 'Pertambangan selain minyak dan gas',
          items: [
            'Mesin-mesin yang dipakai dalam bidang pertambangan, termasuk mesin-mesin yang mengolah produk pelikan.',
          ]
        },
        {
          industry: 'Permintalan, pertenunan dan pencelupan',
          items: [
            'Mesin yang mengolah atau menghasilkan produk-produk tekstil (misalnya kain katun, sutra, serat-serat buatan, wol dan bulu hewan lainnya, linen rami, permadani, kain-kain bulu, tule).',
            'Mesin untuk yang preparation, bleaching, dyeing, printing, finishing, texturing, packaging, dan sejeninsnya.'
          ]
        },
        {
          industry: 'Perkayuan',
          items: [
            'Mesin yang mengolah atau menghasilkan produk-produk kayu, barang-barang dari jerami, rumput, dan bahan anyaman lainnya.',
            'Mesin dan peralatan penggergajian kayu.'
          ]
        },
        {
          industry: 'Industri Kimia',
          items: [
            'Mesin peralatan yang mengolah/menghasilkan produk industri kimia dan industri yang ada hubungannya dengan industri kimia (misalnya bahan kimia anorganis, persenyawaan organis dan anorganis dan logam mulia, elemen radio aktif, isotop, bahan kimia organ1s, produk farmasi, pupuk, obat celup, obat pewarna, cat, pernis, minyak eteris dan resip.oida-resinonida wangi-wangian, obat kecantikan dan obat rias, sabun, detergent dan bahan organis pembersih lainnya, zat albumina, perekat, bahan peledak, produk piroteknik, korek ap1, alloy piroforis, barang fotografi, dan sinematografi).',
            'Mesin yang mengolah/menghasilkan produk industri lainnya (misalnya damar tiruan, bahan plastik, ester dan eter dari selulosa, karet sintetis, karet tiruan, kulit samak, jangat, dan kulit mentah).'
          ]
        },
        {
          industry: 'Industri mesin',
          items: [
            'Mesin yang menghasilkan/memproduksi mesin menengah dan berat (misalnya mesin mobil, mesin kapal).'
          ]
        },
        {
          industry: 'Transportasi dan Pergudangan',
          items: [
            'Kapal penumpang, kapal barang, kapal khusus dibuat untuk pengangkutan barang-barang tertentu (misalnya gandum, batu-batuan, biji tambang, dan sejenisnya) termasuk kapal pendingin dan kapal tangki, kapal penangkapan ikan dan sejenisnya, yang mempunyai berat di atas 100 DWT sampai dengan 1.000 DWT. ',
            'Kapal dibuat khusus untuk menghela atau mendorong kapal, kapal suar, kapal pemadam kebakaran, kapal keruk, keran terapung, dan sejenisnya, yang mempunyai berat di atas 100 DWT sampai dengan 1.000 DWT',
            'Dok terapung',
            'Perahu layar pakai atau tanpa motor yang mempunyai berat di atas 250 DWT',
            'Pesawat terbang dan helikopter-helikopter segala jenis'
          ]
        },
        {
          industry: 'Telekomunikasi',
          items: [
            'Perangkat radio navigasi, radar, dan kendali jarak jauh'
          ]
        },
      ],
    },
    {
      category: 'I. Bukan Bangunan',
      group: 'Kelompok 4',
      assets: [
        {
          industry: 'Konstruksi',
          items: [
            'Mesin berat untuk konstruksi.',
          ]
        },
        {
          industry: 'Transportasi dan Pergudangan',
          items: [
            'Lokomotif uap dan tender atas rel.',
            'Lokomotif listrik atas rel, dijalankan dengan batere atau dengan tenaga listrik dari sumber luar',
            'Lokomotif atas rel lainnya',
            ' Kereta, gerbong penumpang dan barang, termasuk kontainer khusus dibuat dan diperlengkapi untuk ditarik dengan satu alat atau beberapa alat pengangkutan.',
            'Kapal penumpang, kapal barang, kapal khusus dibuat untuk pengangkutan barang-barang tertentu (misalnya gandum, batu-batuan, biji tambang, dan sejenisnya) termasuk kapal pendingin dan kapal tangki, kapal penangkap ikan, dan sejenisnya, yang mempunyai berat di atas 1.000 DWT. ',
            'Dok-dok terapung.'
          ]
        },
      ],
    },
  ];
  
  const AssetTableComponent = ({ assets }) => (
    <div className="mb-8">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Klasifikasi Harta Berwujud Berdasarkan PMK-72/2023
      </h4>
      {assets.map((categoryGroup, idx) => (
        <div key={idx} className="mb-6">
          <h5 className="font-medium text-gray-700 dark:text-gray-200 mb-2">
            {categoryGroup.category} - {categoryGroup.group}
          </h5>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">
                    Jenis Usaha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-3/4">
                    Jenis Harta
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {categoryGroup.assets.map((asset, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {asset.industry}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <ul className="list-disc pl-4">
                        {asset.items.map((item, j) => (
                          <li key={j} className="mb-1">{item}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Panduan Penyusutan Aset
          </h2>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ketentuan Umum Penyusutan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Penyusutan atas pengeluaran untuk pembelian, pendirian, penambahan, perbaikan, atau perubahan
                harta berwujud, kecuali tanah yang berstatus hak milik, hak guna bangunan, hak guna usaha,
                dan hak pakai, yang dimiliki dan digunakan untuk mendapatkan, menagih, dan memelihara
                penghasilan yang mempunyai masa manfaat lebih dari 1 (satu) tahun dilakukan dalam bagian-bagian
                yang sama besar selama masa manfaat yang telah ditentukan bagi harta tersebut.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6">
                Metode Penyusutan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Penyusutan atas pengeluaran harta berwujud selain bangunan dapat dilakukan dalam:
              </p>
              <ul className="list-disc pl-6 text-sm space-y-2 text-gray-600 dark:text-gray-300">
                <li>Bagian-bagian yang sama besar selama masa manfaat (Metode Garis Lurus)</li>
                <li>Bagian-bagian yang menurun selama masa manfaat (Metode Saldo Menurun)</li>
              </ul>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tabel Tarif dan Masa Manfaat Penyusutan Fiskal
              </h3>
              
              {Object.entries(groupedRates).map(([category, rates]) => (
                <TableComponent key={category} rates={rates} title={category} />
              ))}
              <div className="mt-8">
                <AssetTableComponent assets={assetGroups} />
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              <p>
                Untuk informasi lebih lanjut, kunjungi:{' '}
                <a
                  href="http://jdih.kemenkeu.go.id/api/download/46cededa-86ae-4cc9-93e5-b6bef8892074/2023pmkeuangan072.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  PERATURAN MENTERI KEUANGAN REPUBLIK INDONESIA NOMOR 72 TAHUN 2023
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;