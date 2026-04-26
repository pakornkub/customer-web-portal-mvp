import csv, json, re, sys, io

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

csv_path = r'D:\Project_2026\customer-web-portal-mvp\data\PO_Format(SI).csv'

with open(csv_path, 'r', encoding='cp1252') as f:
    reader = csv.reader(f)
    headers = next(reader)
    rows = list(reader)

# Group rows into entries: an entry starts when col[3] (Ship-To) is non-empty
# OR when col[0] (Folder) is non-empty after an empty separator row (for Wilson/Wuxi/Indonesia/Taiwan/Mexico)
entries = []
current = None
prev_empty = True  # treat start as after separator
for row in rows:
    while len(row) < 49:
        row.append('')
    is_empty = not any(cell.strip() for cell in row)
    if is_empty:
        prev_empty = True
        continue
    # New entry: col[3] has Ship-To, OR col[0] has Folder after empty separator
    if row[3].strip() or (row[0].strip() and prev_empty):
        if current:
            entries.append(current)
        current = {'main': row, 'cont': []}
    elif current:
        current['cont'].append(row)
    prev_empty = False
if current:
    entries.append(current)

def collect_multiline(entry, col_idx):
    lines = []
    main_val = entry['main'][col_idx].strip()
    if main_val:
        lines.append(main_val)
    for r in entry['cont']:
        v = r[col_idx].strip()
        if v:
            lines.append(v)
    return '\n'.join(lines)

def first_nonempty(entry, col_idx):
    """For scalar fields: return main row value, else first non-empty continuation row value."""
    v = entry['main'][col_idx].strip()
    if v:
        return v
    for r in entry['cont']:
        v = r[col_idx].strip()
        if v:
            return v
    return ''

def clean(s):
    s = s.replace('\x91', "'").replace('\x92', "'")
    s = s.replace('\x93', '"').replace('\x94', '"')
    s = s.replace('\x96', '-').replace('\x97', '-')
    s = s.replace('\ufffd', '')
    s = s.replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')
    return s.strip()

# Known mapping from CSV Ship-To name -> (SIT id, shipToId)
sit_map = {
    'BRIDGESTONE POZNAN SP/ZO.O': ('SIT-BRIDGESTONE-POZNAN', 'SHIP-BRIDGESTONE-POZNAN'),
    'BRIDGESTONE BRASIL': ('SIT-BRIDGESTONE-BRASIL', 'SHIP-BRIDGESTONE-BRASIL'),
    'BRIDGESTONE HUNGARY': ('SIT-BRIDGESTONE-TATABANYA', 'SHIP-BRIDGESTONE-TATABANYA'),
    'MICHELIN SHENYANG TIRE CO.': ('SIT-MICHELIN-SHENYANG', 'SHIP-MICHELIN-SHENYANG'),
    'SHANGHAI MICHELIN TIRE CO., LTD.': ('SIT-MICHELIN-SHANGHAI', 'SHIP-SHANGHAI-MICHELIN'),
    'Cooper (Kunshan) Tire Co,. Ltd': ('SIT-COOPER-KUNSHAN', 'SHIP-COOPER-KUNSHAN'),
    'GOODYEAR AMIENS SUD': ('SIT-GOODYEAR-AMIENS', 'SHIP-GOODYEAR-DUNLOP-AMIENS'),
    'GOODYEAR DO BRASIL PRODUTOS DE BORRACHA LTDA': ('SIT-GOODYEAR-BRASIL', 'SHIP-GOODYEAR-BRASIL'),
    'SUMITOMO RUBBER BRASIL': ('SIT-SUMITOMO-BRASIL', 'SHIP-SUMITOMO-BRASIL'),
    'SUMITOMO RUBBER SOUTH AFRICA (PTY) LTD.': ('SIT-SUMITOMO-SOUTH-AFRICA', 'SHIP-SUMITOMO-SOUTH-AFRICA'),
    'Sumitomo Rubber (Hunan)CO.LTD': ('SIT-SUMITOMO-HUNAN', 'SHIP-SUMITOMO-HUNAN'),
    'TOYO TYRE MALAISIA': ('SIT-TOYO-MALAYSIA', 'SHIP-TOYO-MALAYSIA'),
    'HENGDASHENG TOYO TIRE(ZHANGJIAGANG) CO., LTD.': ('SIT-HENGDASHENG-TOYO', 'SHIP-HENGDASHENG-TOYO'),
    'TOYO TIRE NORTH AMERICA': ('SIT-TOYO-TIRE-NA', 'SHIP-TOYO-TIRE-NA'),
    'BRIDGESTONE INDIA PRIVATE LIMITED': ('SIT-BRIDGESTONE-INDIA', 'SHIP-BRIDGESTONE-INDIA'),
    'BRIDGESTONE SA (PTY) LTD': ('SIT-BRIDGESTONE-SA', 'SHIP-BRIDGESTONE-SA'),
    'BRISA BRIDGESTONE SABANCI LASTIKSANAYI VE TICARET A.S.': ('SIT-BRISA-TURKEY', 'SHIP-BRISA-TURKEY'),
    'BRIDGESTONE FIRESTONE NT WILSON PLANT': ('SIT-BRIDGESTONE-FIRESTONE-WILSON', 'SHIP-BRIDGESTONE-FIRESTONE-WILSON'),
    'BRIDGESTONE (WUXI) TIRE CO., LTD.': ('SIT-BRIDGESTONE-WUXI', 'SHIP-BRIDGESTONE-WUXI'),
    'P.T. BRIDGESTONE TIRE INDONESIA': ('SIT-BRIDGESTONE-INDONESIA', 'SHIP-PT-BRIDGESTONE'),
    'BRIDGESTONE TAIWAN CO., LTD.': ('SIT-BRIDGESTONE-TAIWAN', 'SHIP-BRIDGESTONE-TAIWAN'),
    'BRIDGESTONE DE MEXICO, S.A. DE C.V.': ('SIT-BRIDGESTONE-MEXICO', 'SHIP-BRIDGESTONE-MEXICO'),
}

# Fuzzy match helper
def find_sit(ship_to_name):
    name = ship_to_name.strip()
    if name in sit_map:
        return sit_map[name]
    # Fuzzy: try partial
    for k, v in sit_map.items():
        if k.lower() in name.lower() or name.lower() in k.lower():
            return v
    # Extra: handle encoding-mangled names
    if 'hunan' in name.lower():
        return sit_map.get('Sumitomo Rubber (Hunan)CO.LTD')
    return None

def esc_ts(s):
    """Escape string for TypeScript single-quoted literal"""
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')

print("  siTemplates: [")

for i, entry in enumerate(entries):
    m = entry['main']
    ship_to = clean(m[3]) if m[3].strip() else clean(m[1])
    
    mapping = find_sit(ship_to)
    if not mapping:
        print(f"    // SKIPPED: {ship_to} (no SIT mapping)", file=sys.stderr)
        continue
    
    sit_id, ship_to_id = mapping

    attn = clean(collect_multiline(entry, 4))
    frm = clean(collect_multiline(entry, 5))
    po_header = clean(m[8])
    no2_header = clean(m[10])
    no2_val = clean(m[11])
    mat_code_hdr = clean(m[12])
    mat_code = clean(m[13])
    note_under_mat = clean(m[14])
    user = clean(collect_multiline(entry, 15))
    country = clean(m[16])
    shipper = clean(collect_multiline(entry, 17))
    feeder = clean(first_nonempty(entry, 18))
    mother = clean(first_nonempty(entry, 19))
    vessel_co = clean(first_nonempty(entry, 20))
    forwarder = clean(first_nonempty(entry, 21))
    port_loading = clean(first_nonempty(entry, 24))
    destination = clean(first_nonempty(entry, 26))
    booking = clean(first_nonempty(entry, 27))
    bl_type = clean(first_nonempty(entry, 29))
    free_time = clean(first_nonempty(entry, 30))
    eori = clean(first_nonempty(entry, 32))

    consignee = clean(collect_multiline(entry, 28))
    courier = clean(collect_multiline(entry, 31))
    notify = clean(collect_multiline(entry, 33))
    also1 = clean(collect_multiline(entry, 34))
    also2 = clean(collect_multiline(entry, 35))
    deliver_to = clean(collect_multiline(entry, 36))
    reqs = clean(collect_multiline(entry, 37))
    note1_ml = clean(collect_multiline(entry, 38))
    note2_ml = clean(collect_multiline(entry, 39))
    note3_ml = clean(collect_multiline(entry, 40))
    desc = clean(collect_multiline(entry, 44))
    under_desc = clean(collect_multiline(entry, 45))
    shipping_mark_ml = clean(collect_multiline(entry, 47))
    below_sig = clean(collect_multiline(entry, 48))

    # Build comment
    folder = clean(m[0])
    comment_name = ship_to

    print(f"    // -- {comment_name} {'--' * 20}")
    print(f"    {{")
    print(f"      id: '{sit_id}',")
    print(f"      shipToId: '{ship_to_id}',")
    print(f"      attn: '{esc_ts(attn)}',")
    print(f"      from: '{esc_ts(frm)}',")
    print(f"      poNumberHeader: '{esc_ts(po_header)}',")
    print(f"      no2Header: '{esc_ts(no2_header)}',")
    print(f"      no2: '{esc_ts(no2_val)}',")
    print(f"      materialCodeHeader: '{esc_ts(mat_code_hdr)}',")
    print(f"      materialCode: '{esc_ts(mat_code)}',")
    print(f"      noteUnderMaterial: '{esc_ts(note_under_mat)}',")
    print(f"      user: '{esc_ts(user)}',")
    print(f"      country: '{esc_ts(country)}',")
    print(f"      shipper: '{esc_ts(shipper)}',")
    print(f"      feederVessel: '{esc_ts(feeder)}',")
    print(f"      motherVessel: '{esc_ts(mother)}',")
    print(f"      vesselCompany: '{esc_ts(vessel_co)}',")
    print(f"      forwarder: '{esc_ts(forwarder)}',")
    print(f"      portOfLoading: '{esc_ts(port_loading)}',")

    # Consignee: use multi-line with \n
    if '\n' in consignee:
        print(f"      consignee:")
        print(f"        '{esc_ts(consignee)}',")
    else:
        print(f"      consignee: '{esc_ts(consignee)}',")

    print(f"      blType: '{esc_ts(bl_type)}',")
    print(f"      freeTime: '{esc_ts(free_time)}',")

    if '\n' in courier:
        print(f"      courierAddress:")
        print(f"        '{esc_ts(courier)}',")
    else:
        print(f"      courierAddress: '{esc_ts(courier)}',")

    print(f"      eoriNo: '{esc_ts(eori)}',")
    print(f"      bookingNo: '{esc_ts(booking)}',")

    if '\n' in notify:
        print(f"      notifyParty:")
        print(f"        '{esc_ts(notify)}',")
    else:
        print(f"      notifyParty: '{esc_ts(notify)}',")

    if '\n' in also1:
        print(f"      alsoNotify1:")
        print(f"        '{esc_ts(also1)}',")
    else:
        print(f"      alsoNotify1: '{esc_ts(also1)}',")

    print(f"      alsoNotify2: '{esc_ts(also2)}',")

    if '\n' in deliver_to:
        print(f"      deliverTo:")
        print(f"        '{esc_ts(deliver_to)}',")
    else:
        print(f"      deliverTo: '{esc_ts(deliver_to)}',")

    if '\n' in reqs:
        print(f"      requirements:")
        print(f"        '{esc_ts(reqs)}',")
    else:
        print(f"      requirements: '{esc_ts(reqs)}',")

    if '\n' in note1_ml:
        print(f"      note:")
        print(f"        '{esc_ts(note1_ml)}',")
    else:
        print(f"      note: '{esc_ts(note1_ml)}',")

    if '\n' in note2_ml:
        print(f"      note2:")
        print(f"        '{esc_ts(note2_ml)}',")
    else:
        print(f"      note2: '{esc_ts(note2_ml)}',")

    print(f"      note3: '{esc_ts(note3_ml)}',")
    print(f"      description: '{esc_ts(desc)}',")
    print(f"      underDescription: '{esc_ts(under_desc)}',")

    if '\n' in shipping_mark_ml:
        print(f"      shippingMark:")
        print(f"        '{esc_ts(shipping_mark_ml)}',")
    else:
        print(f"      shippingMark: '{esc_ts(shipping_mark_ml)}',")

    print(f"      belowSignature: '{esc_ts(below_sig or 'UBE Elastomer Co. Ltd.')}',")
    print(f"      createdAt: '2026-01-01T00:00:00.000Z',")
    print(f"      updatedAt: '2026-01-01T00:00:00.000Z'")
    print(f"    }},")

print("  ] as SiTemplate[]")
