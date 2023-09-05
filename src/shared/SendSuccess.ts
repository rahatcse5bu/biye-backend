export const sendSuccess = <T>(
	message: string,
	data: T,
	statusCode: number = 200
) => {
	return {
		success: true,
		statusCode: statusCode,
		message,
		data,
	};
};
