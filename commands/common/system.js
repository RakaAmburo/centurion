let system = {
    'phrase.not.found': {
        func: async (data) => {
            return ['not found']
        }
    },
    'phrase.repated': {
        func: async (data) => {
            return ['repeated command match']
        }
    }
}

export default system