export interface MaterialItem {
    dots_number: string;
    internal_order: string;
    material_group: string;
    material_group_desc: string;
    material_item: string;
    material_item_desc_en: string;
    gl_account_desc: string;
    cost_center: string;
    cost_center_desc: string;
    gl: string;
    item_number: number;
    proposed_amt: number;
    realization_amt: number;
    short_text: string;
    remark_item: string;
    base_realization_amt: number;
    vat_indicator: boolean;
    tax_code: string;
    vat_pct: number;
    vat_amt: number;
    diff_amt: number;
    hash_id: string;
    acc_assignment: string | null;
    asset: string | null;
}
export type MaterialItemsResponse = MaterialItem[];