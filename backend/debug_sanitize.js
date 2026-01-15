
import mongoSanitize from 'express-mongo-sanitize';

console.log('mongoSanitize type:', typeof mongoSanitize);
console.log('mongoSanitize keys:', Object.keys(mongoSanitize));
console.log('mongoSanitize.sanitize type:', typeof mongoSanitize.sanitize);

try {
    const req = { body: { '$where': '1=1' } };
    const sanitized = mongoSanitize.sanitize(req.body);
    console.log('Sanitized:', sanitized);
} catch (e) {
    console.log('Error calling sanitize:', e.message);
}
