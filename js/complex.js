/*
 * ï°ëfêîÉNÉâÉX
 */
function Complex(real, imag){
	this.real = real;
    this.imag = imag;
}
			
Complex.prototype.toString = function(){
	return this.real + ' + ' + this.imag + 'j';
}

Complex.prototype.abs = function() {
	return Math.sqrt(this.real*this.real + this.imag*this.imag);
}

Complex.prototype.arg = function() {
	return Math.atan2(this.imag, this.real);
}

Complex.sum = function(a, b){
	return new Complex(a.real + b.real, a.imag + b.imag);
}

Complex.prod = function(a, b){
	return new Complex(a.real * b.real - a.imag * b.imag, a.real * b.imag + a.imag * b.real);
}
