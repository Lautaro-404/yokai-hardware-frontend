package com.yokai.hardware.exception;

public class StockConflictException extends ConflictException {
    public StockConflictException(String message) {
        super(message);
    }
}
