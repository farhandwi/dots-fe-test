export interface MaterialDetailResponse {
    dots_number: string;
    curr_id: string;
    form_type: string;
    material_item: string;
    material_item_desc_en: string;
    gl: string;
    gl_account_desc: string;
    type: string;
    material_group: string;
    material_group_desc: string;
    short_text: string;
    order_unit: number;
    remark_item: string;
    proposed_amt: string;
    base_realization_amt: string;
    vat_indicator: boolean;
    tax_code: string;
    vat_pct: string;
    vat_amt: string;
    realization_amt: string;
    diff_amt: string;
}

export interface ApiResponse {
    error_code: number;
    error_desc: string;
    data: MaterialDetailResponse;
}