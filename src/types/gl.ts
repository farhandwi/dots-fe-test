export interface Gl {
    BUKRS: string;
    dots_number: string;
    cost_center: string;
    gl: string;
    gl_desc: string;
    cost_center_desc: string;
    proposed_amt: string;
    realization_amt: string;
    diff_amt: string;
};

export type GlResponse = Gl[];