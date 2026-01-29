export class CreateApplicationDto {
    applicantId: string;
    amount: number;
    tenor: number;
    interestRate: number;
    purpose?: string;
}